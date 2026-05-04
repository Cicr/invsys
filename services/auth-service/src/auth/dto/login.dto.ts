import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ description: 'User username or email', example: 'admin' })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ description: 'User password', example: 'password' })
    @IsString()
    @MinLength(6)
    password!: string;
}
