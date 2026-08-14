import { Injectable, ConflictException, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RoleEnum } from '../../generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const emailLower = dto.email.toLowerCase();

      // Hashing menggunakan bcryptjs secara asinkron (Non-blocking I/O)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password_clear, salt);

      // Eksekusi penulisan data ke PostgreSQL (Role selalu dipaksa 'siswa' untuk registrasi publik)
      const user = await this.prisma.user.create({
        data: {
          nama: dto.nama,
          email: emailLower,
          password_hash: hashedPassword,
          role: RoleEnum.siswa,
          sekolah_id: dto.sekolah_id || null,
          nis: dto.nis,
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

  async resetPasswordWithToken(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        reset_password_token: dto.token,
      },
    });

    if (!user) {
      throw new BadRequestException('Tautan atur ulang kata sandi tidak valid atau telah digunakan.');
    }

    if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
      throw new BadRequestException('Tautan atur ulang kata sandi telah kedaluwarsa (lebih dari 24 jam). Silakan minta tautan baru kepada Admin.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });

    return {
      message: 'Kata sandi berhasil diperbarui! Silakan masuk menggunakan kata sandi baru Anda.',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const dataToUpdate: any = {};

    if (dto.nama !== undefined) dataToUpdate.nama = dto.nama;
    if (dto.kelas !== undefined) dataToUpdate.kelas = dto.kelas;
    if (dto.no_hp !== undefined) dataToUpdate.no_hp = dto.no_hp;
    if (dto.tempat_lahir !== undefined) dataToUpdate.tempat_lahir = dto.tempat_lahir;
    if (dto.tahun_pendaftaran !== undefined) dataToUpdate.tahun_pendaftaran = dto.tahun_pendaftaran;
    if (dto.foto_profil !== undefined) dataToUpdate.foto_profil = dto.foto_profil;

    if (dto.tanggal_lahir !== undefined) {
      dataToUpdate.tanggal_lahir = dto.tanggal_lahir ? new Date(dto.tanggal_lahir) : null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { sekolah: true },
    });

    return this.buildAuthResponse(updatedUser);
  }

  // Helper pembentuk response terstandarisasi & Dynamic Avatar
  private buildAuthResponse(user: any) {
    // Algoritma pemecah nama untuk inisial gambar profil otonom
    const nameParts = user.nama.trim().split(/\s+/);
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : nameParts[0][0].substring(0, 2).toUpperCase();

    // Menghasilkan JWT token asli berbasis payload terenkripsi
    const tokenPayload = { sub: user.id, role: user.role, email: user.email };
    const jwtToken = this.jwtService.sign(tokenPayload);

    const userPhoto = user.foto_profil || `https://ui-avatars.com/api/?name=${initials}&background=0D8ABC&color=fff&bold=true`;

    return {
      // Format 1: Kompatibilitas dengan frontend yang membaca data.token & data.user
      token: jwtToken,
      user: {
        id: user.id,
        name: user.nama,
        school: user.sekolah?.nama_sekolah || 'PT Toyota-Astra Motor (TAM)',
        avatar: userPhoto,
        email: user.email,
        role: user.role.toLowerCase(), // Pastikan lowercase
        nis: user.nis,
        kelas: user.kelas,
        no_hp: user.no_hp,
        tanggal_lahir: user.tanggal_lahir,
        tempat_lahir: user.tempat_lahir,
        tahun_pendaftaran: user.tahun_pendaftaran,
      },
      // Format 2: Format respons API terstandarisasi baru
      status: 'success',
      message: 'Autentikasi berhasil dieksekusi',
      data: {
        access_token: jwtToken,
        profile: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          nis: user.nis,
          kelas: user.kelas,
          no_hp: user.no_hp,
          tanggal_lahir: user.tanggal_lahir,
          tempat_lahir: user.tempat_lahir,
          tahun_pendaftaran: user.tahun_pendaftaran,
          foto_profil: user.foto_profil,
          nama_sekolah: user.sekolah?.nama_sekolah || 'PT Toyota-Astra Motor (TAM)',
          dynamic_avatar: userPhoto,
        },
      },
    };
  }
}