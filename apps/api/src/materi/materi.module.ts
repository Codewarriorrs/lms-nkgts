import { Module } from '@nestjs/common';
import { MateriController } from './materi.controller';
import { MateriService } from './materi.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MateriController],
  providers: [MateriService, PrismaService],
})
export class MateriModule {}
