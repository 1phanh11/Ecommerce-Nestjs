import {
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class LoginDTO {
  @IsEmail({}, { message: 'Email not valid.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Please provide password' })
  password: string;
}

export class LogoutDTO {
  @IsString()
  userId: string;
}
