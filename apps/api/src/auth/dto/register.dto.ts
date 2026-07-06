import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsInt } from "class-validator";
import { RoleEnum, StatusGuruEnum } from '../../../generated/prisma';

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

    @IsEnum(RoleEnum, { message: 'Role harus berupa admin, guru, atau siswa'})
    @IsNotEmpty()
    role: RoleEnum;

    @IsEnum(StatusGuruEnum, { message: 'Status guru harus berupa praktisi, kandidat, atau warga sekolah'})
    @IsOptional()
    status_guru?: StatusGuruEnum;    
}