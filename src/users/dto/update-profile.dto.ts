import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  ValidateBy,
  ValidateIf,
  IsStrongPassword,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name at least 1 character' })
  name?: string;
}

export class UpdatePasswordDto {
  @IsString({ message: 'Current password must be provided' })
  @IsStrongPassword(
    {
      minLength: 6,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1,
    },
    { message: 'Wrong current password' },
  )
  currentPassword: string;

  @IsStrongPassword(
    {
      minLength: 6,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password too weak! Must contain at least 1 number, 1 uppercase character and 1 symbol',
    },
  )
  newPassword: string;
}
