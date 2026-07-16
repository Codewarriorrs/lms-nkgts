import { IsString, IsOptional, IsObject } from "class-validator";

export class CreateTugasPraktekDto {
    @IsOptional()
    @IsString()
    tanggal?: string; // Menampung task.date (YYYY-MM-DD)

    @IsOptional()
    @IsString()
    area_pengisian?: string; // Menampung task.area

    @IsOptional()
    @IsString({ message: 'Keterangan harus berupa teks' })
    keterangan?: string; // Menampung task.note

    @IsOptional()
    @IsObject()
    detail_jawaban?: any; // Objek JSON dinamis
}