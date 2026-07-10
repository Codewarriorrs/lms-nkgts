import { Module } from '@nestjs/common';
import { ProjectKaizenService } from './project-kaizen.service';
import { ProjectKaizenController } from './project-kaizen.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ProjectKaizenController],
  providers: [ProjectKaizenService, PrismaService],
  exports: [ProjectKaizenService],
})
export class ProjectKaizenModule {}
