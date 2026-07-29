import { IsNotEmpty, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class ResetProgressDto {
  @IsNotEmpty({ message: 'Titik awal modul tidak boleh kosong' })
  @IsInt({ message: 'Titik awal modul harus berupa angka/integer' })
  @Min(1, { message: 'Titik awal modul minimal 1' })
  @Max(5, { message: 'Titik awal modul maksimal 5' })
  startFromModule: number;

  @IsOptional()
  @IsString({ message: 'Tipe reset harus berupa string' })
  resetType?: string; // 'all' | 'materi_latsol' | 'praktik'
}

