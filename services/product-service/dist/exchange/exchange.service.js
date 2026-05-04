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
var ExchangeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const cache_manager_1 = require("@nestjs/cache-manager");
const rxjs_1 = require("rxjs");
let ExchangeService = ExchangeService_1 = class ExchangeService {
    httpService;
    cacheManager;
    logger = new common_1.Logger(ExchangeService_1.name);
    constructor(httpService, cacheManager) {
        this.httpService = httpService;
        this.cacheManager = cacheManager;
    }
    async getRates() {
        const cachedRates = await this.cacheManager.get('exchange_rates');
        if (cachedRates) {
            this.logger.log('Returning exchange rates from Redis Cache');
            return cachedRates;
        }
        try {
            this.logger.log('Fetching exchange rates from external API');
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get('https://open.er-api.com/v6/latest/USD'));
            const rates = response.data.rates;
            await this.cacheManager.set('exchange_rates', rates, 3600);
            return rates;
        }
        catch (error) {
            this.logger.error('Failed to fetch exchange rates, using fallback', error.message);
            return { EUR: 0.92, GBP: 0.78, JPY: 150.0 };
        }
    }
};
exports.ExchangeService = ExchangeService;
exports.ExchangeService = ExchangeService = ExchangeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [axios_1.HttpService, Object])
], ExchangeService);
//# sourceMappingURL=exchange.service.js.map