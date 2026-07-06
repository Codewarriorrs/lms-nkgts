import { IsEmail, IsNotEmpty, IsString, MinLength} from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Kata sandi tidak boleh kurang dari 8 karakter'})
    password: string;
}