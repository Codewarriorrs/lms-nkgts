import { IsOptional, IsString, IsNotEmpty, IsInt } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong jika disediakan' })
  nama?: string;

  @IsOptional()
  @IsString()
  kelas?: string;

  @IsOptional()
  @IsString()
  no_hp?: string;

  @IsOptional()
  @IsString()
  tanggal_lahir?: string; // Dapat diparse menjadi Date di service

  @IsOptional()
  @IsString()
  tempat_lahir?: string;

  @IsOptional()
  @IsInt({ message: 'Tahun pendaftaran harus berupa angka' })
  tahun_pendaftaran?: number;

  @IsOptional()
  @IsString()
  foto_profil?: string; // Berupa URL atau string Base64
}
