import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { InvitationModule } from './invitation/invitation.module';
import { MateriModule } from './materi/materi.module';
import { TugasPraktekModule } from './tugas-praktek/tugas-praktek.module';

@Module({
  imports: [AuthModule, InvitationModule, MateriModule, TugasPraktekModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

