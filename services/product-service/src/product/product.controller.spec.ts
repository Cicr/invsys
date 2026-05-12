import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = { id: 'uuid-1', name: 'Test', priceUsd: 10 };

  const mockProductService = {
    create: jest.fn().mockResolvedValue(mockProduct),
    findAll: jest.fn().mockResolvedValue([mockProduct]),
    get: jest.fn().mockResolvedValue(mockProduct),
    update: jest.fn().mockResolvedValue({ ...mockProduct, priceUsd: 20 }),
    remove: jest.fn().mockResolvedValue({ message: 'Product uuid-1 archived successfully' }),
    getPriceHistory: jest.fn().mockResolvedValue([]),
  };

  const adminReq = { user: { role: 'admin' } };
  const userReq = { user: { role: 'user' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a product', async () => {
    mockProductService.create.mockResolvedValueOnce(mockProduct);
    const res = await controller.create({ name: 'Test', priceUsd: 10 }, adminReq);
    expect(res.id).toBe('uuid-1');
    expect(service.create).toHaveBeenCalledWith({ name: 'Test', priceUsd: 10 });
  });

  it('should throw ForbiddenException when non-admin creates product', async () => {
    await expect(controller.create({ name: 'Test', priceUsd: 10 }, userReq)).rejects.toThrow(ForbiddenException);
  });

  it('should retrieve all products', async () => {
    const res = await controller.findAll();
    expect(Array.isArray(res)).toBe(true);
    expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should get a product by id', async () => {
    mockProductService.get.mockResolvedValueOnce(mockProduct);
    const res = await controller.get('uuid-1');
    expect(res.id).toBe('uuid-1');
    expect(service.get).toHaveBeenCalledWith('uuid-1', undefined);
  });

  it('should throw NotFoundException when product not found', async () => {
    mockProductService.get.mockResolvedValueOnce(null);
    await expect(controller.get('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('should update a product', async () => {
    const res = await controller.update('uuid-1', { priceUsd: 20 }, adminReq);
    expect(res.priceUsd).toBe(20);
    expect(service.update).toHaveBeenCalledWith('uuid-1', { priceUsd: 20 });
  });

  it('should throw ForbiddenException when non-admin updates product', async () => {
    await expect(controller.update('uuid-1', { priceUsd: 20 }, userReq)).rejects.toThrow(ForbiddenException);
  });

  it('should delete a product', async () => {
    const res = await controller.remove('uuid-1', adminReq);
    expect(res.message).toContain('uuid-1');
    expect(service.remove).toHaveBeenCalledWith('uuid-1');
  });

  it('should throw NotFoundException when deleting non-existent product', async () => {
    mockProductService.remove.mockResolvedValueOnce(null);
    await expect(controller.remove('bad-id', adminReq)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when non-admin deletes product', async () => {
    await expect(controller.remove('uuid-1', userReq)).rejects.toThrow(ForbiddenException);
  });

  it('should return price history', async () => {
    const res = await controller.getHistory('uuid-1');
    expect(Array.isArray(res)).toBe(true);
    expect(service.getPriceHistory).toHaveBeenCalledWith('uuid-1');
  });
});
