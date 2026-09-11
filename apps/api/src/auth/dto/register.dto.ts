import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsInt } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong'})
    nama: string;

    @IsEmail({}, {message: 'Format email tidak valid'})
    @IsNotEmpty({message: 'Email tidak boleh kosong'})
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, {message: 'Kata sandi minimal harus 8 karakter'})
    password_clear: string;

    @IsOptional()
    @IsInt({message: 'Sekolah ID harus berupa angka'})
    sekolah_id?: number;

    @IsOptional()
    @IsString()
    nis?: string;
}