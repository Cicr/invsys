import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// In-memory store for disabled users (TD-2: user state management)
const disabledUsers = new Set<string>();

// In-memory user registry (Sprint 1 scope, backed by DB in Sprint 2)
// User objects now contain roles as requested in QA-Delivery-Report
const registeredUsers: { username: string; password: string; role: string }[] = [];

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const lowerUsername = username.toLowerCase();
        
        // Check if user is disabled
        if (disabledUsers.has(lowerUsername)) {
            return null;
        }

        // Check hardcoded admin (Sprint 1 bootstrap)
        if (lowerUsername === 'admin' && pass === 'Admin123') {
            return { userId: 1, username: 'admin', role: 'admin' };
        }

        // Check registered users
        const found = registeredUsers.find(u => u.username === lowerUsername && u.password === pass);
        if (found) {
            return { userId: found.username, username: found.username, role: found.role };
        }

        return null;
    }

    isUserDisabled(username: string): boolean {
        return disabledUsers.has(username.toLowerCase());
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.userId, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.userId,
                username: user.username,
                role: user.role
            }
        };
    }

    async listUsers() {
        return [
            { id: 1, username: 'admin', role: 'admin', disabled: this.isUserDisabled('admin') },
            ...registeredUsers.map(u => ({
                id: u.username,
                username: u.username,
                role: u.role,
                disabled: this.isUserDisabled(u.username)
            }))
        ];
    }

    async register(username: string, password: string, role: string = 'user') {
        const lowerUsername = username.toLowerCase();
        
        // Check if already exists
        if (lowerUsername === 'admin' || registeredUsers.some(u => u.username === lowerUsername)) {
            throw new Error('User already exists');
        }

        registeredUsers.push({ username: lowerUsername, password, role });
        return { status: 'created', user: { username: lowerUsername, role } };
    }

    async updateUser(username: string, data: { password?: string, role?: string }) {
        const lowerUsername = username.toLowerCase();
        
        const user = registeredUsers.find(u => u.username === lowerUsername);
        
        // Handle the special bootstrap admin case separately if it's not in registeredUsers
        if (!user && lowerUsername === 'admin') {
            // Note: In Sprint 1, 'admin' is hardcoded. 
            // If we want to allow editing its role/password, we'd need to move it to state.
            // For now, let's treat 'admin' as a read-only super-admin, 
            // but allow editing ANY registered user (including those with admin role).
            throw new Error('Bootstrap super-admin is immutable in this version. Edit other admin accounts instead.');
        }

        if (!user) {
            throw new Error('User not found');
        }

        if (data.password) {
            user.password = data.password;
        }
        if (data.role) {
            user.role = data.role;
        }

        return { status: 'updated', user: { username: user.username, role: user.role } };
    }

    async refresh(token: string) {
        const payload = this.jwtService.verify(token);
        const newPayload = { username: payload.username, sub: payload.sub, role: payload.role };
        return {
            access_token: this.jwtService.sign(newPayload),
        };
    }

    async disableUser(username: string) {
        const lowerUsername = username.toLowerCase();
        if (disabledUsers.has(lowerUsername)) {
            disabledUsers.delete(lowerUsername);
            return { status: 'enabled', username: lowerUsername };
        } else {
            disabledUsers.add(lowerUsername);
            return { status: 'disabled', username: lowerUsername };
        }
    }
}
