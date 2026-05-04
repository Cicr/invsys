import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async validateUser(username: string, pass: string): Promise<any> {
        // In INVSYS-2 we are mocking DB connection for user validation.
        // Database validation logic against Postgres user table follows in subsequent phases.
        if (username === 'admin' && pass === 'password') {
            return { userId: 1, username: 'admin' };
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.userId };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
