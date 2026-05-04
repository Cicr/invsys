import { HttpService } from '@nestjs/axios';
import type { Cache } from 'cache-manager';
export declare class ExchangeService {
    private readonly httpService;
    private cacheManager;
    private readonly logger;
    constructor(httpService: HttpService, cacheManager: Cache);
    getRates(): Promise<{
        [key: string]: number;
    }>;
}
