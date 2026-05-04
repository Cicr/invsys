"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const disabledUsers = new Set();
const registeredUsers = [];
let AuthService = class AuthService {
    jwtService;
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async validateUser(username, pass) {
        if (disabledUsers.has(username)) {
            return null;
        }
        if (username === 'admin' && pass === 'password') {
            return { userId: 1, username: 'admin', role: 'admin' };
        }
        const found = registeredUsers.find(u => u.username === username && u.password === pass);
        if (found) {
            return { userId: found.username, username: found.username, role: 'user' };
        }
        return null;
    }
    isUserDisabled(username) {
        return disabledUsers.has(username);
    }
    async login(user) {
        const payload = { username: user.username, sub: user.userId, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
    async register(username, email, password) {
        registeredUsers.push({ username, email, password });
        return { status: 'created', user: { username, email } };
    }
    async refresh(token) {
        const payload = this.jwtService.verify(token);
        const newPayload = { username: payload.username, sub: payload.sub, role: payload.role };
        return {
            access_token: this.jwtService.sign(newPayload),
        };
    }
    async disableUser(username) {
        disabledUsers.add(username);
        return { status: 'disabled', username };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map