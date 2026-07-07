import { Controller, Get, Post, Body, HttpCode, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller()
export class AppController implements OnModuleInit {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedUsersIfEmpty();
  }

  private async seedUsersIfEmpty() {
    try {
      const count = await this.prisma.user.count();
      if (count === 0) {
        console.log('Database users table is empty. Seeding initial mock users...');
        const passwordHash = bcrypt.hashSync('password123', 10);
        
        const schoolNames = [
          'SMK Negeri 26 Jakarta',
          'SMK Negeri 2 Surabaya',
          'SMK Negeri 1 Semarang',
          'N-KGTS Pusat'
        ];

        const schoolsMap: Record<string, any> = {};

        for (const name of schoolNames) {
          let sekolah = await this.prisma.sekolah.findUnique({
            where: { nama_sekolah: name }
          });
          if (!sekolah) {
            sekolah = await this.prisma.sekolah.create({
              data: { nama_sekolah: name }
            });
          }
          schoolsMap[name] = sekolah;
        }

        const defaultUsers = [
          {
            email: 'isya@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Isya Asyhari',
            sekolah_id: schoolsMap['SMK Negeri 26 Jakarta'].id,
            role: 'siswa' as const,
          },
          {
            email: 'yesaya@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Yesaya',
            sekolah_id: schoolsMap['SMK Negeri 2 Surabaya'].id,
            role: 'siswa' as const,
          },
          {
            email: 'bintang@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Bintang',
            sekolah_id: schoolsMap['SMK Negeri 1 Semarang'].id,
            role: 'siswa' as const,
          },
          {
            email: 'budi@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Budi Santoso',
            sekolah_id: schoolsMap['SMK Negeri 1 Semarang'].id,
            role: 'siswa' as const,
          },
          {
            email: 'admin@nkgts.com',
            password_hash: passwordHash,
            nama: 'Administrator',
            sekolah_id: schoolsMap['N-KGTS Pusat'].id,
            role: 'admin' as const,
          },
        ];

        for (const user of defaultUsers) {
          await this.prisma.user.create({ data: user });
        }
        console.log('Seeding initial mock users completed successfully!');
      }
    } catch (error) {
      console.error('Failed to seed default users:', error);
    }
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('schools')
  async getSchools() {
    return this.prisma.sekolah.findMany({
      orderBy: { nama_sekolah: 'asc' }
    });
  }
}

