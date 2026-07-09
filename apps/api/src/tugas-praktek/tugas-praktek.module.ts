import { Module } from '@nestjs/common';
import { TugasPraktekService } from './tugas-praktek.service';
import { TugasPraktekController } from './tugas-praktek.controller';
import { PrismaService } from '../prisma.service'; // Ambil langsung service-nya

@Module({
  controllers: [TugasPraktekController],
  providers: [TugasPraktekService, PrismaService], // Daftarkan PrismaService di sini
})
export class TugasPraktekModule {}