import { Module } from '@nestjs/common';
import { LatsolController } from './latsol.controller';
import { LatsolService } from './latsol.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LatsolController],
  providers: [LatsolService, PrismaService],
  exports: [LatsolService],
})
export class LatsolModule {}
