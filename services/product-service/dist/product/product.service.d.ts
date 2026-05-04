import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { PriceHistory } from './price-history.entity';
import { ClientKafka } from '@nestjs/microservices';
import { ExchangeService } from '../exchange/exchange.service';
export declare class ProductService {
    private readonly productRepo;
    private readonly historyRepo;
    private readonly kafkaClient;
    private readonly exchangeService;
    private readonly logger;
    constructor(productRepo: Repository<Product>, historyRepo: Repository<PriceHistory>, kafkaClient: ClientKafka, exchangeService: ExchangeService);
    create(data: {
        name: string;
        priceUsd: number;
        category?: string;
        sku?: string;
        description?: string;
    }): Promise<Product>;
    findAll(category?: string): Promise<Product[]>;
    get(id: string, currency?: string): Promise<Product | null>;
    update(id: string, data: Partial<{
        name: string;
        priceUsd: number;
        category: string;
        description: string;
    }>): Promise<Product | null>;
    remove(id: string): Promise<{
        message: string;
        id: string;
    } | null>;
    getPriceHistory(productId: string): Promise<PriceHistory[]>;
}
