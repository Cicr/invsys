import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ClientKafka } from '@nestjs/microservices';
import { ExchangeService } from '../exchange/exchange.service';
export declare class ProductService {
    private readonly productRepo;
    private readonly kafkaClient;
    private readonly exchangeService;
    constructor(productRepo: Repository<Product>, kafkaClient: ClientKafka, exchangeService: ExchangeService);
    create(data: {
        name: string;
        priceUsd: number;
    }): Promise<Product>;
    get(id: string): Promise<{
        priceEur: number;
        id: string;
        name: string;
        priceUsd: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
