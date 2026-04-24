import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class AdminUpdateUserDto {
  // TODO: Admin chỉ được update role — không được update password của user khác
  // Thêm decorator phù hợp
  @IsEnum(Role, {
    message: `Role not available except ${Role.ADMIN} and ${Role.USER}`,
  })
  @IsOptional()
  role?: Role;
}
