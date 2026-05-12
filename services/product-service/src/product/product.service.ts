import {
  Injectable, Inject, NotFoundException, BadRequestException, Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { PriceHistory } from './price-history.entity';
import { ClientKafka } from '@nestjs/microservices';
import { ExchangeService } from '../exchange/exchange.service';
import * as crypto from 'crypto';

// Whitelisted currencies for strict validation (TD-3)
const VALID_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK', 'DOP'];

function signKafkaMessage(data: any) {
  const secret = process.env.KAFKA_HMAC_SECRET || 'super-secret-key';
  const payload = JSON.stringify(data);
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return {
    payload,
    signature
  };
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(PriceHistory)
    private readonly historyRepo: Repository<PriceHistory>,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly exchangeService: ExchangeService,
  ) {}

  async create(data: { name: string; priceUsd: number; category?: string; sku?: string; description?: string }) {
    const product = this.productRepo.create(data);
    const saved = await this.productRepo.save(product);

    // Emit event asynchronously (TD-4: Kafka idempotency on consumer side)
    this.kafkaClient.emit('product.created', signKafkaMessage({
      productId: saved.id,
      action: 'product.created',
    })).subscribe({
      error: (err) => this.logger.error('Kafka emit error:', err),
    });

    return saved;
  }

  async findAll(category?: string, currency?: string) {
    let products: Product[];
    if (category) {
      products = await this.productRepo.find({ where: { category } });
    } else {
      products = await this.productRepo.find();
    }

    if (currency && currency !== 'USD') {
      const upperCurrency = currency.toUpperCase();
      if (!VALID_CURRENCIES.includes(upperCurrency)) {
        throw new BadRequestException(`Invalid currency: '${currency}'. Valid currencies: USD, ${VALID_CURRENCIES.join(', ')}`);
      }

      const rates = await this.exchangeService.getRates();
      const rate = rates[upperCurrency];

      if (!rate) {
        throw new BadRequestException(`Currency rate not available for '${currency}'`);
      }

      return products.map(p => ({
        ...p,
        [`price${upperCurrency}`]: Number((p.priceUsd * rate).toFixed(2)),
      }));
    }

    return products;
  }

  async get(id: string, currency?: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) return null;

    // TD-3: Strict currency validation - reject invalid tickers
    if (currency && currency !== 'USD') {
      if (!VALID_CURRENCIES.includes(currency.toUpperCase())) {
        throw new BadRequestException(`Invalid currency: '${currency}'. Valid currencies: USD, ${VALID_CURRENCIES.join(', ')}`);
      }

      const rates = await this.exchangeService.getRates();
      const rate = rates[currency.toUpperCase()];

      if (!rate) {
        throw new BadRequestException(`Currency rate not available for '${currency}'`);
      }

      const convertedPrice = Number((product.priceUsd * rate).toFixed(2));
      return {
        ...product,
        [`price${currency.toUpperCase()}`]: convertedPrice,
      };
    }

    return product;
  }

  async update(id: string, data: Partial<{ name: string; priceUsd: number; category: string; description: string }>) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) return null;

    // Track price history if priceUsd is changing (TD-PROD-08)
    if (data.priceUsd !== undefined && Number(data.priceUsd) !== Number(product.priceUsd)) {
      const historyEntry = this.historyRepo.create({
        productId: id,
        oldPriceUsd: Number(product.priceUsd),
        newPriceUsd: data.priceUsd,
      });
      await this.historyRepo.save(historyEntry);
    }

    Object.assign(product, data);
    const updated = await this.productRepo.save(product);

    // Emit update event to Kafka
    this.kafkaClient.emit('product.updated', signKafkaMessage({
      productId: updated.id,
      action: 'product.updated',
    })).subscribe({
      error: (err) => this.logger.error('Kafka emit error on update:', err),
    });

    return updated;
  }

  async remove(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) return null;

    // Soft-delete: sets deleted_at timestamp, record is retained in DB
    await this.productRepo.softDelete(id);

    // Emit delete event to Kafka
    this.kafkaClient.emit('product.deleted', signKafkaMessage({
      productId: id,
      action: 'product.deleted',
    })).subscribe({
      error: (err) => this.logger.error('Kafka emit error on delete:', err),
    });

    return { message: `Product ${id} archived successfully`, id };
  }

  async getPriceHistory(productId: string) {
    return this.historyRepo.find({
      where: { productId },
      order: { changedAt: 'DESC' },
    });
  }
}
