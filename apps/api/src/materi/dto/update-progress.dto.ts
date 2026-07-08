import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsNotEmpty()
  @IsNumber()
  modul_teori_id: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  scroll_progress: number;

  @IsNotEmpty()
  @IsString()
  status: 'belum_dimulai' | 'sedang_dibaca' | 'selesai';
}
