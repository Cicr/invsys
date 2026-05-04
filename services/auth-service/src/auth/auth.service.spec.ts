import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should validate valid user', async () => {
    const result = await service.validateUser('admin', 'password');
    expect(result).toEqual({ userId: 1, username: 'admin' });
  });

  it('should reject invalid user', async () => {
    const result = await service.validateUser('admin', 'wrong');
    expect(result).toBeNull();
  });

  it('should sign and return token on login', async () => {
    const result = await service.login({ username: 'admin', userId: 1 });
    expect(result).toEqual({ access_token: 'mock_token' });
    expect(jwtService.sign).toHaveBeenCalledWith({ username: 'admin', sub: 1 });
  });
});
