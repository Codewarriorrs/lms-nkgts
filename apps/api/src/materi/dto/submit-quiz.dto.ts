import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class SubmitQuizDto {
  @IsNotEmpty()
  @IsNumber()
  modul_teori_id: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}
