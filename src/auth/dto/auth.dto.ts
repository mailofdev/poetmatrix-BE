import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role, SELF_SERVICE_ROLES } from '../../users/role.js';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class RegisterDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(PASSWORD_PATTERN, {
    message: 'password must include a letter and a number',
  })
  password: string;

  @ApiPropertyOptional({ enum: SELF_SERVICE_ROLES, default: Role.Reader })
  @IsOptional()
  @IsIn(SELF_SERVICE_ROLES)
  role?: Role;
}

export class LoginDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(256)
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(256)
  token: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(PASSWORD_PATTERN, {
    message: 'password must include a letter and a number',
  })
  password: string;
}
