"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const crypto = __importStar(require("crypto"));
const VALID_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK', 'DOP'];
function signKafkaMessage(data) {
    const secret = process.env.KAFKA_HMAC_SECRET || 'super-secret-key';
    const payload = JSON.stringify(data);
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return {
        payload,
        signature
    };
}
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
        this.kafkaClient.emit('product.created', signKafkaMessage({
            productId: saved.id,
            action: 'product.created',
        })).subscribe({
            error: (err) => this.logger.error('Kafka emit error:', err),
        });
        return saved;
    }
    async findAll(category, currency) {
        let products;
        if (category) {
            products = await this.productRepo.find({ where: { category } });
        }
        else {
            products = await this.productRepo.find();
        }
        if (currency && currency !== 'USD') {
            const upperCurrency = currency.toUpperCase();
            if (!VALID_CURRENCIES.includes(upperCurrency)) {
                throw new common_1.BadRequestException(`Invalid currency: '${currency}'. Valid currencies: USD, ${VALID_CURRENCIES.join(', ')}`);
            }
            const rates = await this.exchangeService.getRates();
            const rate = rates[upperCurrency];
            if (!rate) {
                throw new common_1.BadRequestException(`Currency rate not available for '${currency}'`);
            }
            return products.map(p => ({
                ...p,
                [`price${upperCurrency}`]: Number((p.priceUsd * rate).toFixed(2)),
            }));
        }
        return products;
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
        this.kafkaClient.emit('product.updated', signKafkaMessage({
            productId: updated.id,
            action: 'product.updated',
        })).subscribe({
            error: (err) => this.logger.error('Kafka emit error on update:', err),
        });
        return updated;
    }
    async remove(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            return null;
        await this.productRepo.softDelete(id);
        this.kafkaClient.emit('product.deleted', signKafkaMessage({
            productId: id,
            action: 'product.deleted',
        })).subscribe({
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