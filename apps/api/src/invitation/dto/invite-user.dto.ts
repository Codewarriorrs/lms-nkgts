import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { RoleEnum } from '../../../generated/prisma';

export class InviteUserDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  nama: string;

  @IsEnum(RoleEnum, { message: 'Role tidak valid' })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role: RoleEnum;

  @IsInt({ message: 'Sekolah ID harus berupa angka' })
  @IsNotEmpty({ message: 'Sekolah ID tidak boleh kosong' })
  sekolah_id: number;

  @IsOptional()
  @IsString()
  nis?: string;
}
