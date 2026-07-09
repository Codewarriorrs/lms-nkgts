import { IsNotEmpty, IsString, IsOptional } from "class-validator";
export class CreateTugasPraktekDto {

    @IsNotEmpty()
    @IsString()
    tanggal: string; // Menampung task.date (YYYY-MM-DD)

    @IsNotEmpty()
    @IsString()
    area_pengisian: string; // Menampung task.area (1-10)

    @IsOptional()
    @IsString({ message: 'Keterangan harus berupa teks' })
    keterangan?: string; // Menampung task.note
}