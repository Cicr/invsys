import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ description: 'User desired username', example: 'newuser' })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ description: 'User password', example: 'securepassword123' })
    @IsString()
    @MinLength(6)
    password!: string;
}
