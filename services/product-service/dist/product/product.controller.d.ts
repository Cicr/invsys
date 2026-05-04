import { ProductService } from './product.service';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    create(data: {
        name: string;
        priceUsd: number;
        category?: string;
        sku?: string;
        description?: string;
    }): Promise<import("./product.entity").Product>;
    findAll(category?: string): Promise<import("./product.entity").Product[]>;
    getHistory(id: string): Promise<import("./price-history.entity").PriceHistory[]>;
    get(id: string, currency?: string): Promise<import("./product.entity").Product>;
    update(id: string, data: Partial<{
        name: string;
        priceUsd: number;
        category: string;
        description: string;
    }>): Promise<import("./product.entity").Product>;
    patch(id: string, data: Partial<{
        name: string;
        priceUsd: number;
        category: string;
        description: string;
    }>): Promise<import("./product.entity").Product>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
