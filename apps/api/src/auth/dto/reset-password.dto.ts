import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token atur ulang kata sandi wajib diisi' })
  @IsString({ message: 'Token harus berupa string' })
  token: string;

  @IsNotEmpty({ message: 'Kata sandi baru wajib diisi' })
  @IsString({ message: 'Kata sandi baru harus berupa string' })
  @MinLength(6, { message: 'Kata sandi baru minimal 6 karakter' })
  newPassword: string;
}
