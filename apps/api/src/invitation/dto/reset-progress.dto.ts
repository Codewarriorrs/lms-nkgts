import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class ResetProgressDto {
  @IsNotEmpty({ message: 'Titik awal modul tidak boleh kosong' })
  @IsInt({ message: 'Titik awal modul harus berupa angka/integer' })
  @Min(1, { message: 'Titik awal modul minimal 1' })
  @Max(5, { message: 'Titik awal modul maksimal 5' })
  startFromModule: number;
}
