import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Endpoint 1: Menerima file biner lewat Multipart Form-data
  @Post('file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    }),
  )
  async uploadBinary(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'galeri',
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    const fileUrl = await this.uploadService.uploadBinaryFile(file, folder);
    return { url: fileUrl };
  }

  // Endpoint 2: Menerima Payload Base64 JSON
  @Post('base64')
  @UseGuards(JwtAuthGuard)
  async uploadBase64(
    @Body('image') base64Image: string,
    @Query('folder') folder: string = 'galeri',
  ) {
    if (!base64Image) {
      throw new BadRequestException('Data base64 tidak boleh kosong');
    }
    const fileUrl = await this.uploadService.uploadBase64File(base64Image, folder);
    return { url: fileUrl };
  }
}
