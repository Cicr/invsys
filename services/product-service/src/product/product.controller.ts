import {
  Controller, Post, Get, Put, Patch, Delete,
  Body, Param, Query, UseGuards, NotFoundException, HttpCode,
  ParseUUIDPipe, Request, ForbiddenException
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() data: { name: string; priceUsd: number; category?: string; sku?: string; description?: string }, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Only admins can create products');
    return this.productService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query('category') category?: string, @Query('currency') currency?: string) {
    return this.productService.findAll(category, currency);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.getPriceHistory(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string, @Query('currency') currency?: string) {
    const product = await this.productService.get(id, currency);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<{ name: string; priceUsd: number; category: string; description: string }>,
    @Request() req: any
  ) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Only admins can update products');
    const product = await this.productService.update(id, data);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<{ name: string; priceUsd: number; category: string; description: string }>,
    @Request() req: any
  ) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Only admins can patch products');
    const product = await this.productService.update(id, data);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Only admins can delete products');
    const result = await this.productService.remove(id);
    if (!result) throw new NotFoundException(`Product ${id} not found`);
    return result;
  }
}
