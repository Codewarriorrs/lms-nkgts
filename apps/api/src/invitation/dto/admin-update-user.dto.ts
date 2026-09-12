import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { RoleEnum } from '../../../generated/prisma';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  nama?: string;

  @IsOptional()
  @IsEnum(RoleEnum, { message: 'Role tidak valid' })
  role?: RoleEnum;

  @IsOptional()
  @IsInt({ message: 'Sekolah ID harus berupa angka' })
  sekolah_id?: number;

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
  tempat_lahir?: string;

  @IsOptional()
  @IsString()
  tanggal_lahir?: string;

  @IsOptional()
  @IsInt()
  tahun_pendaftaran?: number;
}
