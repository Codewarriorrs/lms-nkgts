import { IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerItemDto {
  @IsNotEmpty()
  @IsNumber()
  soal_id: number;

  @IsNotEmpty()
  @IsNumber()
  jawaban_dipilih: number;
}

export class SubmitQuizDto {
  @IsNotEmpty()
  @IsNumber()
  modul_teori_id: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers?: QuizAnswerItemDto[];

  @IsOptional()
  @IsNumber()
  score?: number;
}
