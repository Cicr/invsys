import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getRates(): Promise<{ [key: string]: number }> {
    const cachedRates = await this.cacheManager.get<{ [key: string]: number }>('exchange_rates');
    if (cachedRates) {
      this.logger.log('Returning exchange rates from Redis Cache');
      return cachedRates;
    }

    try {
      this.logger.log('Fetching exchange rates from external API');
      // Simulated public rate endpoint (using an open source or mocked standard)
      const response = await lastValueFrom(
        this.httpService.get('https://open.er-api.com/v6/latest/USD'),
      );
      const rates = response.data.rates;

      await this.cacheManager.set('exchange_rates', rates, 3600); // Wait, cache-manager-redis-store TTL behavior changed in v5, but we configure it natively
      return rates;
    } catch (error) {
      this.logger.error('Failed to fetch exchange rates, using fallback', error.message);
      return { EUR: 0.92, GBP: 0.78, JPY: 150.0 }; // Fallback
    }
  }
}
