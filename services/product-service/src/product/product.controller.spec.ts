import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  beforeEach(async () => {
    const mockProductService = {
      create: jest.fn().mockResolvedValue({ id: 'uuid-1', name: 'Test', priceUsd: 10 }),
      get: jest.fn().mockResolvedValue({ id: 'uuid-1', name: 'Test', priceUsd: 10, priceEur: 9 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a product', async () => {
    const res = await controller.create({ name: 'Test', priceUsd: 10 });
    expect(res.id).toBe('uuid-1');
    expect(service.create).toHaveBeenCalledWith({ name: 'Test', priceUsd: 10 });
  });

  it('should get a product', async () => {
    const res = await controller.get('uuid-1');
    expect(res.id).toBe('uuid-1');
    expect(service.get).toHaveBeenCalledWith('uuid-1');
  });
});
