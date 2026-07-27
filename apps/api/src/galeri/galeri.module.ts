import { Module } from '@nestjs/common';
import { GaleriController } from './galeri.controller';
import { GaleriService } from './galeri.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [GaleriController],
  providers: [GaleriService, PrismaService],
})
export class GaleriModule {}
