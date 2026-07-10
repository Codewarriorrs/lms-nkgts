import { IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsInt()
  soal_id: number;

  @IsInt()
  jawaban_siswa: number; // Index (0, 1, 2, dll)
}

export class SubmitLatsolDto {
  @IsInt()
  modul_teori_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  jawaban: AnswerDto[];
}
