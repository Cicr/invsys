import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { PriceHistory } from './price-history.entity';
import { ExchangeService } from '../exchange/exchange.service';

describe('ProductService', () => {
  let service: ProductService;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((product) => Promise.resolve({ id: 'uuid-1', ...product })),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue({}),
  };

  const mockHistoryRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockKafkaClient = {
    emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  };

  const mockExchangeService = {
    getRates: jest.fn().mockResolvedValue({ EUR: 0.9 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: mockRepo },
        { provide: getRepositoryToken(PriceHistory), useValue: mockHistoryRepo },
        { provide: 'KAFKA_SERVICE', useValue: mockKafkaClient },
        { provide: ExchangeService, useValue: mockExchangeService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  it('should create a product and emit an event', async () => {
    mockKafkaClient.emit.mockReturnValue({ subscribe: jest.fn() });
    const res = await service.create({ name: 'Test', priceUsd: 100 });
    expect(res.id).toBe('uuid-1');
    expect(mockKafkaClient.emit).toHaveBeenCalledWith('product.created', { productId: 'uuid-1', action: 'product.created' });
  });

  it('should return null if product not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);
    const res = await service.get('non-existent');
    expect(res).toBeNull();
  });

  it('should return a product with EUR price when currency is provided', async () => {
    mockExchangeService.getRates.mockResolvedValueOnce({ EUR: 0.9 });
    mockRepo.findOne.mockResolvedValueOnce({ id: 'uuid-1', name: 'Test', priceUsd: 100 });
    const res = await service.get('uuid-1', 'EUR') as any;
    expect(res.priceEUR).toBe(90);
  });

  it('should return plain product without currency param', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'uuid-1', name: 'Test', priceUsd: 100 });
    const res = await service.get('uuid-1');
    expect(res).toBeDefined();
    expect((res as any).id).toBe('uuid-1');
  });

  it('should return null when removing a non-existent product', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);
    const res = await service.remove('non-existent');
    expect(res).toBeNull();
  });
});
