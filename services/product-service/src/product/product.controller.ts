import {
  Controller, Post, Get, Put, Patch, Delete,
  Body, Param, Query, UseGuards, NotFoundException, HttpCode
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() data: { name: string; priceUsd: number; category?: string; sku?: string; description?: string }) {
    return this.productService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query('category') category?: string) {
    return this.productService.findAll(category);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.productService.getPriceHistory(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string, @Query('currency') currency?: string) {
    const product = await this.productService.get(id, currency);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<{ name: string; priceUsd: number; category: string; description: string }>) {
    const product = await this.productService.update(id, data);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async patch(@Param('id') id: string, @Body() data: Partial<{ name: string; priceUsd: number; category: string; description: string }>) {
    const product = await this.productService.update(id, data);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    const deleted = await this.productService.remove(id);
    if (!deleted) throw new NotFoundException(`Product ${id} not found`);
    return { message: `Product ${id} deleted successfully` };
  }
}
