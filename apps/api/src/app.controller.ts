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
        
        const defaultUsers = [
          {
            email: 'isya@nkgts.sch.id',
            password: passwordHash,
            name: 'Isya Asyhari',
            school: 'SMK Negeri 26 Jakarta',
            avatar: 'IA',
            role: 'SISWA' as const,
          },
          {
            email: 'yesaya@nkgts.sch.id',
            password: passwordHash,
            name: 'Yesaya',
            school: 'SMK Negeri 2 Surabaya',
            avatar: 'YS',
            role: 'SISWA' as const,
          },
          {
            email: 'bintang@nkgts.sch.id',
            password: passwordHash,
            name: 'Bintang',
            school: 'SMK Negeri 1 Semarang',
            avatar: 'BT',
            role: 'SISWA' as const,
          },
          {
            email: 'budi@nkgts.sch.id',
            password: passwordHash,
            name: 'Budi Santoso',
            school: 'SMK Negeri 1 Semarang',
            avatar: 'BS',
            role: 'SISWA' as const,
          },
          {
            email: 'admin@nkgts.com',
            password: passwordHash,
            name: 'Administrator',
            school: 'N-KGTS Pusat',
            avatar: 'AD',
            role: 'ADMIN' as const,
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

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() body: any) {
    const { email, password } = body;
    if (!email || !password) {
      throw new UnauthorizedException('Email dan password harus diisi');
    }

    const emailLower = email.toLowerCase();
    
    // Find user in database
    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      throw new UnauthorizedException('Email tidak terdaftar');
    }

    // Verify hashed password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah');
    }

    return {
      token: `mock-jwt-token-${user.email.split('@')[0]}-${Date.now()}`,
      user: {
        name: user.name,
        school: user.school,
        avatar: user.avatar,
        email: user.email,
        role: user.role.toLowerCase(), // frontend expects lowercase
      }
    };
  }
}
