"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const price_history_entity_1 = require("./price-history.entity");
const microservices_1 = require("@nestjs/microservices");
const exchange_service_1 = require("../exchange/exchange.service");
const VALID_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK'];
let ProductService = ProductService_1 = class ProductService {
    productRepo;
    historyRepo;
    kafkaClient;
    exchangeService;
    logger = new common_1.Logger(ProductService_1.name);
    constructor(productRepo, historyRepo, kafkaClient, exchangeService) {
        this.productRepo = productRepo;
        this.historyRepo = historyRepo;
        this.kafkaClient = kafkaClient;
        this.exchangeService = exchangeService;
    }
    async create(data) {
        const product = this.productRepo.create(data);
        const saved = await this.productRepo.save(product);
        this.kafkaClient.emit('product.created', {
            productId: saved.id,
            action: 'product.created',
        }).subscribe({
            error: (err) => this.logger.error('Kafka emit error:', err),
        });
        return saved;
    }
    async findAll(category) {
        if (category) {
            return this.productRepo.find({ where: { category } });
        }
        return this.productRepo.find();
    }
    async get(id, currency) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            return null;
        if (currency && currency !== 'USD') {
            if (!VALID_CURRENCIES.includes(currency.toUpperCase())) {
                throw new common_1.BadRequestException(`Invalid currency: '${currency}'. Valid currencies: USD, ${VALID_CURRENCIES.join(', ')}`);
            }
            const rates = await this.exchangeService.getRates();
            const rate = rates[currency.toUpperCase()];
            if (!rate) {
                throw new common_1.BadRequestException(`Currency rate not available for '${currency}'`);
            }
            const convertedPrice = Number((product.priceUsd * rate).toFixed(2));
            return {
                ...product,
                [`price${currency.toUpperCase()}`]: convertedPrice,
            };
        }
        return product;
    }
    async update(id, data) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            return null;
        if (data.priceUsd !== undefined && Number(data.priceUsd) !== Number(product.priceUsd)) {
            const historyEntry = this.historyRepo.create({
                productId: id,
                oldPriceUsd: Number(product.priceUsd),
                newPriceUsd: data.priceUsd,
            });
            await this.historyRepo.save(historyEntry);
        }
        Object.assign(product, data);
        const updated = await this.productRepo.save(product);
        this.kafkaClient.emit('product.updated', {
            productId: updated.id,
            action: 'product.updated',
        }).subscribe({
            error: (err) => this.logger.error('Kafka emit error on update:', err),
        });
        return updated;
    }
    async remove(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            return null;
        await this.productRepo.softDelete(id);
        this.kafkaClient.emit('product.deleted', {
            productId: id,
            action: 'product.deleted',
        }).subscribe({
            error: (err) => this.logger.error('Kafka emit error on delete:', err),
        });
        return { message: `Product ${id} archived successfully`, id };
    }
    async getPriceHistory(productId) {
        return this.historyRepo.find({
            where: { productId },
            order: { changedAt: 'DESC' },
        });
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = ProductService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(price_history_entity_1.PriceHistory)),
    __param(2, (0, common_1.Inject)('KAFKA_SERVICE')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        microservices_1.ClientKafka,
        exchange_service_1.ExchangeService])
], ProductService);
//# sourceMappingURL=product.service.js.map