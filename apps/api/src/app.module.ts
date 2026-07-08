import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { InvitationModule } from './invitation/invitation.module';
import { MateriModule } from './materi/materi.module';

@Module({
  imports: [AuthModule, InvitationModule, MateriModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

