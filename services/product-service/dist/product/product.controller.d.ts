import { ProductService } from './product.service';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    create(data: {
        name: string;
        priceUsd: number;
    }): Promise<import("./product.entity").Product>;
    get(id: string): Promise<{
        priceEur: number;
        id: string;
        name: string;
        priceUsd: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
