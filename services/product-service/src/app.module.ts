import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { ExchangeModule } from './exchange/exchange.module';
import { Product } from './product/product.entity';
import { PriceHistory } from './product/price-history.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PRODUCTS_DB_HOST || 'localhost',
      port: parseInt(process.env.PRODUCTS_DB_PORT || '5432', 10),
      username: process.env.PRODUCTS_DB_USER || 'postgres',
      password: process.env.PRODUCTS_DB_PASSWORD || 'local_secret_password',
      database: process.env.PRODUCTS_DB_NAME || 'products_db',
      entities: [Product, PriceHistory],
      synchronize: true, // Only for dev
    }),
    ProductModule,
    ExchangeModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
