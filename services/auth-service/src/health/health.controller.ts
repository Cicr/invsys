import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Check microservice execution parity' })
    check() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
