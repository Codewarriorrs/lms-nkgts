import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateContactDto {
  @IsNotEmpty({ message: 'Nama contact person tidak boleh kosong' })
  @IsString()
  cp_name: string;

  @IsNotEmpty({ message: 'Nomor WhatsApp tidak boleh kosong' })
  @IsString()
  cp_whatsapp: string;
}
