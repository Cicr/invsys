import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// In-memory store for disabled users (TD-2: user state management)
// In production this should be backed by the users table in Postgres.
const disabledUsers = new Set<string>();

// In-memory user registry for registration (Sprint 1 scope, backed by DB in Sprint 2)
const registeredUsers: { username: string; email: string; password: string }[] = [];

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async validateUser(username: string, pass: string): Promise<any> {
        // Check if user is disabled (TD-2)
        if (disabledUsers.has(username)) {
            return null; // Will result in 401; controller can differentiate
        }

        // Check hardcoded admin (Sprint 1 bootstrap)
        if (username === 'admin' && pass === 'password') {
            return { userId: 1, username: 'admin', role: 'admin' };
        }

        // Check registered users
        const found = registeredUsers.find(u => u.username === username && u.password === pass);
        if (found) {
            return { userId: found.username, username: found.username, role: 'user' };
        }

        return null;
    }

    isUserDisabled(username: string): boolean {
        return disabledUsers.has(username);
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.userId, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(username: string, email: string, password: string) {
        registeredUsers.push({ username, email, password });
        return { status: 'created', user: { username, email } };
    }

    async refresh(token: string) {
        const payload = this.jwtService.verify(token);
        const newPayload = { username: payload.username, sub: payload.sub, role: payload.role };
        return {
            access_token: this.jwtService.sign(newPayload),
        };
    }

    async disableUser(username: string) {
        disabledUsers.add(username);
        return { status: 'disabled', username };
    }
}
