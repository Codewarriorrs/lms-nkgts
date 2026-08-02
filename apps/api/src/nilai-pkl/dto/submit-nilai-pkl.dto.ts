import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsObject } from 'class-validator';

export class SubmitNilaiPklDto {
  @IsString()
  @IsNotEmpty({ message: 'ID Siswa tidak boleh kosong' })
  siswa_id: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty({ message: 'Nilai akhir tidak boleh kosong' })
  nilai: number;

  @IsObject()
  @IsNotEmpty({ message: 'Detail nilai tidak boleh kosong' })
  detail_nilai: Record<string, number>;

  @IsString()
  @IsOptional()
  catatan?: string;

  @IsString()
  @IsNotEmpty({ message: 'Rekomendasi tidak boleh kosong' })
  rekomendasi: string;
}
