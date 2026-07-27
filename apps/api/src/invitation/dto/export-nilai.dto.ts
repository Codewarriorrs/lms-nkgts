import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportNilaiDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'sekolah_id harus berupa angka integer' })
  sekolah_id?: number;
}
