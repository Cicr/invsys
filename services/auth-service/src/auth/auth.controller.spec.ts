import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            isUserDisabled: jest.fn().mockReturnValue(false),
            register: jest.fn().mockResolvedValue({ status: 'created', user: { username: 'testuser', role: 'user' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should successfully login valid users', async () => {
      const mockUser = { userId: 1, username: 'admin', role: 'admin' };
      const mockToken = { access_token: 'mock_jwt', user: { id: 1, username: 'admin', role: 'admin' } };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue(mockToken);

      const result = await controller.login({ username: 'admin', password: 'password' });
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'password');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockToken);
    });

    it('should throw UnauthorizedException on invalid users', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(controller.login({ username: 'admin', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should return mock created status', async () => {
      const dto = { username: 'testuser', password: 'password', role: 'user' };
      const req = { user: { role: 'admin' } };
      const result = await controller.register(dto, req);

      expect(result).toEqual({ status: 'created', user: { username: dto.username, role: dto.role } });
    });
  });

  describe('updateUser', () => {
    it('should call authService.updateUser', async () => {
      const username = 'testuser';
      const body = { role: 'admin' };
      const req = { user: { role: 'admin' } };
      
      const mockResult = { status: 'updated', user: { username, role: 'admin' } };
      (authService as any).updateUser = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.updateUser(username, body, req);
      expect(result).toEqual(mockResult);
      expect(authService.updateUser).toHaveBeenCalledWith(username, body);
    });
  });
});
