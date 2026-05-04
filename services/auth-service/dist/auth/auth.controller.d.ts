import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    register(registerDto: RegisterDto): Promise<{
        status: string;
        user: {
            username: string;
            email: string;
        };
    }>;
    refresh(req: any): Promise<{
        access_token: string;
    }>;
    disable(body: {
        username: string;
    }, req: any): Promise<{
        status: string;
        username: string;
    }>;
}
