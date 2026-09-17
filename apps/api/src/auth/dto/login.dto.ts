import { IsEmail, IsNotEmpty, IsString, MinLength} from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Kata sandi wajib diisi' })
    @MinLength(6, { message: 'Kata sandi tidak boleh kurang dari 6 karakter' })
    password: string;
}