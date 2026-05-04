import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
    describe('configuration success', () => {
        let strategy: JwtStrategy;

        beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    JwtStrategy,
                    {
                        provide: ConfigService,
                        useValue: {
                            get: jest.fn().mockImplementation((key: string) => {
                                if (key === 'JWT_SECRET') return 'secret';
                                return null;
                            }),
                        },
                    },
                ],
            }).compile();

            strategy = module.get<JwtStrategy>(JwtStrategy);
        });

        it('should validate valid payload', async () => {
            const result = await strategy.validate({ sub: 1, username: 'admin' });
            expect(result).toEqual({ userId: 1, username: 'admin' });
        });

        it('should throw exception on empty payload', async () => {
            await expect(strategy.validate(null)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('configuration failure', () => {
        it('should throw error if JWT_SECRET missing', async () => {
            try {
                const module: TestingModule = await Test.createTestingModule({
                    providers: [
                        JwtStrategy,
                        {
                            provide: ConfigService,
                            useValue: {
                                get: jest.fn().mockReturnValue(undefined), // simulates missing
                            },
                        },
                    ],
                }).compile();
                await module.resolve<JwtStrategy>(JwtStrategy);
                fail('Should throw error prior to resolving');
            } catch (err: any) {
                expect(err.message).toBe('FATAL: JWT_SECRET is not defined in the environment.');
            }
        });
    });
});
