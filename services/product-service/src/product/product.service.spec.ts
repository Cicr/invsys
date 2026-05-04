import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ExchangeService } from '../exchange/exchange.service';

describe('ProductService', () => {
  let service: ProductService;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((product) => Promise.resolve({ id: 'uuid-1', ...product })),
    findOne: jest.fn(),
  };

  const mockKafkaClient = {
    emit: jest.fn(),
  };

  const mockExchangeService = {
    getRates: jest.fn().mockResolvedValue({ EUR: 0.9 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: mockRepo },
        { provide: 'KAFKA_SERVICE', useValue: mockKafkaClient },
        { provide: ExchangeService, useValue: mockExchangeService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  it('should create a product and emit an event', async () => {
    const res = await service.create({ name: 'Test', priceUsd: 100 });
    expect(res.id).toBe('uuid-1');
    expect(mockKafkaClient.emit).toHaveBeenCalledWith('product.created', { productId: 'uuid-1', action: 'product.created' });
  });

  it('should return null if product not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);
    const res = await service.get('non-existent');
    expect(res).toBeNull();
  });

  it('should return a product with EUR price', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'uuid-1', name: 'Test', priceUsd: 100 });
    const res = await service.get('uuid-1');
    expect(res.priceEur).toBe(90);
  });
});
