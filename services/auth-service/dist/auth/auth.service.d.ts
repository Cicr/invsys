import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    validateUser(username: string, pass: string): Promise<any>;
    isUserDisabled(username: string): boolean;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(username: string, email: string, password: string): Promise<{
        status: string;
        user: {
            username: string;
            email: string;
        };
    }>;
    refresh(token: string): Promise<{
        access_token: string;
    }>;
    disableUser(username: string): Promise<{
        status: string;
        username: string;
    }>;
}
