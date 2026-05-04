import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Authenticate and mint a new JWT payload' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'JWT Generated Successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new Bounded Context Identity.' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User registered.' })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    async register(@Body() registerDto: RegisterDto) {
        // In Sprint 1 / INVSYS-3, we strictly echo back a successful registration mock 
        // guaranteeing class-validator operates flawlessly.
        return { status: 'created', user: { username: registerDto.username, email: registerDto.email } };
    }
}
