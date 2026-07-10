import { IsString, IsArray, IsInt, Min, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateLatsolDto {
  @IsInt()
  modul_teori_id: number;

  @IsString()
  pertanyaan: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  pilihan: string[];

  @IsInt()
  @Min(0)
  jawaban_benar: number;

  @IsInt()
  @Min(1)
  poin: number;

  @IsString()
  @IsOptional()
  image_url?: string;
}
