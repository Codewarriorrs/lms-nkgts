import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsInt } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong'})
    nama: string;

    @IsEmail({}, {message: 'Format email tidak valid'})
    @IsNotEmpty({message: 'Email tidak boleh kosong'})
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Kata sandi tidak boleh kosong' })
    @MinLength(6, { message: 'Kata sandi minimal harus 6 karakter' })
    password_clear: string;

    @IsOptional()
    @IsInt({message: 'Sekolah ID harus berupa angka'})
    sekolah_id?: number;

    @IsOptional()
    @IsString()
    nis?: string;
}