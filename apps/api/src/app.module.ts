import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [AuthModule, InvitationModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

