import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ClientKafka } from '@nestjs/microservices';
import { ExchangeService } from '../exchange/exchange.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly exchangeService: ExchangeService,
  ) {}

  async create(data: { name: string; priceUsd: number }) {
    const product = this.productRepo.create(data);
    const saved = await this.productRepo.save(product);

    // Emit event asynchronously
    this.kafkaClient.emit('product.created', {
      productId: saved.id,
      action: 'product.created',
    }).subscribe({
      error: (err) => console.error('Kafka emit error:', err),
    });

    return saved;
  }

  async get(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      return null;
    }

    const rates = await this.exchangeService.getRates();
    const priceEur = product.priceUsd * (rates.EUR || 0.9);

    return {
      ...product,
      priceEur: Number(priceEur.toFixed(2)),
    };
  }
}
