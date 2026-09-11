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
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const sanitizeFolder = (folder: string = 'galeri'): string => {
  return folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'galeri';
};

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
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (
          !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase()) ||
          !ALLOWED_EXTENSIONS.includes(ext)
        ) {
          return cb(
            new BadRequestException(
              'Tipe file tidak didukung! Hanya diperbolehkan format JPG, PNG, WEBP, dan PDF.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadBinary(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'galeri',
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    const cleanFolder = sanitizeFolder(folder);
    const fileUrl = await this.uploadService.uploadBinaryFile(file, cleanFolder);
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

    const match = base64Image.match(/^data:([A-Za-z-+\/]+);base64,/);
    if (match) {
      const mime = match[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        throw new BadRequestException(
          'Tipe format base64 tidak didukung! Hanya diperbolehkan JPG, PNG, WEBP, dan PDF.',
        );
      }
    }

    const cleanFolder = sanitizeFolder(folder);
    const fileUrl = await this.uploadService.uploadBase64File(base64Image, cleanFolder);
    return { url: fileUrl };
  }
}
