import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor() {
    this.bucket = process.env.BIZNET_S3_BUCKET || '';
    this.endpoint = process.env.BIZNET_S3_ENDPOINT || '';

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: process.env.BIZNET_S3_REGION || 'sgp1',
      credentials: {
        accessKeyId: process.env.BIZNET_S3_ACCESS_KEY || '',
        secretAccessKey: process.env.BIZNET_S3_SECRET_KEY || '',
      },
      forcePathStyle: true, // Wajib bernilai true untuk non-AWS S3
    });
  }

  // Mengunggah file biner dari multipart form-data
  async uploadBinaryFile(
    file: Express.Multer.File,
    folder: string = 'galeri',
  ): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${ext}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );

      return `${this.endpoint}/${this.bucket}/${filename}`;
    } catch (error) {
      throw new InternalServerErrorException(`Gagal mengunggah ke Biznet: ${error.message}`);
    }
  }

  // Mengubah base64 string menjadi Buffer dan mengunggahnya
  async uploadBase64File(base64Str: string, folder: string = 'galeri'): Promise<string> {
    try {
      const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let mimeType = 'image/jpeg';

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Str, 'base64');
      }

      const ext = mimeType.split('/')[1] || 'jpg';
      const filename = `${folder}/${uuidv4()}.${ext}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: filename,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        }),
      );

      return `${this.endpoint}/${this.bucket}/${filename}`;
    } catch (error) {
      throw new InternalServerErrorException(`Gagal memproses base64 ke Biznet: ${error.message}`);
    }
  }
}
