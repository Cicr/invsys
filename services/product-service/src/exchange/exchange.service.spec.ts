import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeService } from './exchange.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';

describe('ExchangeService', () => {
  let service: ExchangeService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
    jest.clearAllMocks();
  });

  it('should return cached rates if available', async () => {
    mockCacheManager.get.mockResolvedValueOnce({ EUR: 0.85 });
    const rates = await service.getRates();
    expect(rates.EUR).toBe(0.85);
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });

  it('should fetch and cache rates from external API if not cached', async () => {
    mockCacheManager.get.mockResolvedValueOnce(null);
    mockHttpService.get.mockReturnValueOnce(of({ data: { rates: { EUR: 0.95 } } }));

    const rates = await service.getRates();
    expect(rates.EUR).toBe(0.95);
    expect(mockCacheManager.set).toHaveBeenCalledWith('exchange_rates', { EUR: 0.95 }, 3600);
  });

  it('should return fallback rates on API failure', async () => {
    mockCacheManager.get.mockResolvedValueOnce(null);
    mockHttpService.get.mockReturnValueOnce(throwError(() => new Error('API down')));

    const rates = await service.getRates();
    expect(rates.EUR).toBe(0.92); // Fallback logic executed
  });
});
