import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Tipe project tidak boleh kosong (proposal/laporan)' })
  tipe: string;

  @IsString()
  @IsNotEmpty({ message: 'File URL / content tidak boleh kosong' })
  file_url: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama file tidak boleh kosong' })
  file_name: string;

  @IsString()
  @IsOptional()
  catatan_siswa?: string;
}
