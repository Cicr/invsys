import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../infra/.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('AUTH_DB_HOST'),
        port: configService.get<number>('AUTH_DB_PORT'),
        username: configService.get<string>('AUTH_DB_USER'),
        password: configService.get<string>('AUTH_DB_PASSWORD'),
        database: configService.get<string>('AUTH_DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
