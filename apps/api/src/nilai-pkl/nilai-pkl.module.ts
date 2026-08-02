import { Module } from '@nestjs/common';
import { NilaiPklService } from './nilai-pkl.service';
import { NilaiPklController } from './nilai-pkl.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [NilaiPklController],
  providers: [NilaiPklService, PrismaService],
  exports: [NilaiPklService],
})
export class NilaiPklModule {}
