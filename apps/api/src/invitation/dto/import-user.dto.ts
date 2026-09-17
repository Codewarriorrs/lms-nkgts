import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, IsInt, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleEnum } from '../../../generated/prisma';

export class ImportUserRowDto {
  @IsString()
  @IsNotEmpty()
  tempId: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  nama: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsEnum(RoleEnum, { message: 'Role tidak valid' })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role: RoleEnum;

  @IsOptional()
  @IsInt({ message: 'ID Sekolah harus berupa angka' })
  sekolah_id?: number;

  @IsOptional()
  @IsString()
  sekolah?: string;

  @IsOptional()
  @IsString()
  nis?: string;

  @IsOptional()
  @IsString()
  kelas?: string;

  @IsOptional()
  @IsString()
  jurusan?: string;

  @IsOptional()
  @IsString()
  no_hp?: string;

  @IsOptional()
  @IsString()
  tanggal_lahir?: string;

  @IsOptional()
  @IsString()
  tempat_lahir?: string;

  @IsOptional()
  @IsInt()
  tahun_pendaftaran?: number;
}

export class ImportConfirmDto {
  @IsArray({ message: 'Daftar pengguna harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => ImportUserRowDto)
  users: ImportUserRowDto[];
}
