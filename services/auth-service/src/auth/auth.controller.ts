import {
    Controller, Post, Get, Body, UnauthorizedException,
    ForbiddenException, UseGuards, Request, HttpCode, Patch, Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Authenticate and mint a new JWT payload' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 201, description: 'JWT Generated Successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Account disabled.' })
    async login(@Body() loginDto: LoginDto) {
        // Check disabled state before attempting full validation (returns 403 not 401)
        if (this.authService.isUserDisabled(loginDto.username)) {
            throw new ForbiddenException('Account has been disabled');
        }

        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'List all registered users (Admin only).' })
    async listUsers(@Request() req: any) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Only admins can view users');
        }
        return this.authService.listUsers();
    }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    @ApiOperation({ summary: 'Register a new Bounded Context Identity.' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User registered.' })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    async register(@Body() registerDto: RegisterDto, @Request() req: any) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Only admins can register new users');
        }
        return this.authService.register(registerDto.username, registerDto.password, registerDto.role);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('users/:username')
    @ApiOperation({ summary: 'Update an existing user (Admin only).' })
    async updateUser(
        @Param('username') username: string,
        @Body() body: { password?: string, role?: string },
        @Request() req: any
    ) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Only admins can update users');
        }
        try {
            return this.authService.updateUser(username, body);
        } catch (e: any) {
            throw new UnauthorizedException(e.message);
        }
    }

    @Post('refresh')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Refresh an existing JWT and mint a new token.' })
    @ApiResponse({ status: 201, description: 'New JWT minted.' })
    @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
    async refresh(@Request() req: any) {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];
        if (!token) throw new UnauthorizedException('No token provided');
        try {
            return await this.authService.refresh(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    @Post('disable')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    @ApiOperation({ summary: 'Disable a user account (Admin only).' })
    @ApiResponse({ status: 200, description: 'User disabled.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    async disable(@Body() body: { username: string }, @Request() req: any) {
        // Only admin role may disable accounts
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Only admins can disable accounts');
        }
        return this.authService.disableUser(body.username);
    }
}
