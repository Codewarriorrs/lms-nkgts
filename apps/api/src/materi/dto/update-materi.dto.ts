import { IsOptional, IsString } from 'class-validator';

export class UpdateMateriDto {
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  judul?: string;

  @IsOptional()
  @IsString()
  ringkasan?: string;
}
