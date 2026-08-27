import { IsOptional, IsString, IsNotEmpty, IsInt, MaxLength, Matches, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong jika disediakan' })
  @MaxLength(150, { message: 'Nama lengkap maksimal 150 karakter' })
  nama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Kelas maksimal 20 karakter' })
  kelas?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,16}$/, { message: 'Nomor HP/WhatsApp harus berupa digit angka 9-16 karakter' })
  no_hp?: string;

  @IsOptional()
  @IsString()
  tanggal_lahir?: string; // Dapat diparse menjadi Date di service

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Tempat lahir maksimal 50 karakter' })
  @Matches(/^[\p{L}\s.,'-]+$/u, { message: 'Tempat lahir hanya boleh berupa huruf dan spasi' })
  tempat_lahir?: string;

  @IsOptional()
  @IsInt({ message: 'Tahun pendaftaran harus berupa angka' })
  @Min(2000, { message: 'Tahun pendaftaran minimal tahun 2000' })
  @Max(2100, { message: 'Tahun pendaftaran tidak valid' })
  tahun_pendaftaran?: number;

  @IsOptional()
  @IsString()
  foto_profil?: string; // Berupa URL atau string Base64
}

