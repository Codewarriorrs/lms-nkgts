import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class ReviewProjectDto {
  @IsString()
  @IsOptional()
  catatan_guru?: string;

  @IsInt({ message: 'Nilai harus berupa angka bulat' })
  @IsOptional()
  @Min(0, { message: 'Nilai minimal 0' })
  @Max(100, { message: 'Nilai maksimal 100' })
  nilai?: number;

  @IsString()
  @IsOptional()
  file_revisi_url?: string;

  @IsString()
  @IsOptional()
  file_revisi_name?: string;
}
