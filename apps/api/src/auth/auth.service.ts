import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  // Inject PrismaService yang mengarah ke klien terisolasi kita
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    try {
      const emailLower = dto.email.toLowerCase();

      // Hashing menggunakan bcryptjs secara asinkron (Non-blocking I/O)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password_clear, salt);

      // Eksekusi penulisan data ke PostgreSQL
      const user = await this.prisma.user.create({
        data: {
          nama: dto.nama,
          email: emailLower,
          password_hash: hashedPassword,
          role: dto.role,
          // Kondisional: Status guru hanya diisi jika role-nya adalah guru
          status_guru: dto.role === 'guru' ? dto.status_guru : null,
          sekolah_id: dto.sekolah_id || null,
        },
        include: { sekolah: true },
      });

      return this.buildAuthResponse(user);
    } catch (error) {
      // Menangkap error spesifik Prisma P2002 (Duplikasi data pada field unik / Email crash)
      if (error.code === 'P2002') {
        throw new ConflictException('Akun dengan email tersebut sudah terdaftar di platform N-KGTS');
      }
      throw new InternalServerErrorException('Terjadi kegagalan sistem saat pendaftaran pengguna');
    }
  }

  async login(dto: LoginDto) {
    const emailLower = dto.email.toLowerCase();
    
    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
      include: { sekolah: true },
    });

    // Keamanan industri: Jangan beri tahu secara spesifik apakah email atau password yang salah
    if (!user) {
      throw new UnauthorizedException('Kredensial yang Anda masukkan salah');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Kredensial yang Anda masukkan salah');
    }

    return this.buildAuthResponse(user);
  }

  // Helper pembentuk response terstandarisasi & Dynamic Avatar
  private buildAuthResponse(user: any) {
    // Algoritma pemecah nama untuk inisial gambar profil otonom
    const nameParts = user.nama.trim().split(/\s+/);
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : nameParts[0][0].substring(0, 2).toUpperCase();

    // Mock Token terstruktur sebelum implementasi JWT resmi minggu depan
    const mockAccessToken = `nkgts_v1_secure_pack.${Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')}`;

    return {
      status: 'success',
      message: 'Autentikasi berhasil dieksekusi',
      data: {
        access_token: mockAccessToken,
        profile: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          status_guru: user.status_guru,
          nama_sekolah: user.sekolah?.nama_sekolah || 'PT Toyota-Astra Motor (TAM)',
          dynamic_avatar: `https://ui-avatars.com/api/?name=${initials}&background=0D8ABC&color=fff&bold=true`,
        },
      },
    };
  }
}