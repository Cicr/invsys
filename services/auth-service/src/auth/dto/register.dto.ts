import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ description: 'Desired username', example: 'newuser' })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ description: 'User role', example: 'user', enum: ['user', 'admin'] })
    @IsString()
    @IsIn(['user', 'admin'])
    role!: string;

    @ApiProperty({ description: 'User password', example: 'securepassword123' })
    @IsString()
    @MinLength(6)
    password!: string;
}
