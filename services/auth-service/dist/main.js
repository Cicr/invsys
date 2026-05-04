"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = new swagger_1.DocumentBuilder()
        .setTitle('INVSYS Auth API')
        .setDescription('The INVSYS Auth Microservice API description')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('AUTH_APP_PORT') || 3001;
    await app.listen(port);
    console.log(`Auth Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map