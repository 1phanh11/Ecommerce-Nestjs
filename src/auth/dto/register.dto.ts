import {
  IsEmail,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDTO {
  @IsString({ message: 'Name not valid' })
  @MinLength(3, { message: 'Name at least 3 character' })
  @MaxLength(50, { message: 'Name maximum 50 character' })
  name: string;

  @IsEmail({}, { message: 'Email not valid' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password at least 6 character' })
  @MaxLength(100, { message: 'Password maximum 100 character' })
  @Matches(/\d|[A-Z]/g, {
    message: 'Password has at least 1 number and 1 uppercase character',
  })
  password: string;
}
