import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Role } from '../role.js';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role })
  @IsIn(Object.values(Role))
  role: Role;
}
