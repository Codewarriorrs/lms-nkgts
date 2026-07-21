import { Injectable, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { RoleEnum } from '../../generated/prisma';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private async sendInvitationEmail(
    email: string,
    nama: string,
    token: string,
    role: string,
    namaSekolah: string,
  ): Promise<string | undefined> {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;

    const hasBrevo = !!brevoApiKey && !!brevoSenderEmail;
    const hasGmail = gmailUser && gmailPass && !gmailUser.includes('placeholder') && !gmailPass.includes('placeholder');

    // Jika tidak ada satu pun konfigurasi email, lewati pengiriman
    if (!hasBrevo && !hasGmail) {
      return 'Konfigurasi email (Brevo API Key atau Gmail SMTP) belum diatur di server.';
    }

    // ... (sisa pengisian variabel cpName, cpWa, frontendUrl, dll)
    const cpNameSettings = await this.prisma.settings.findUnique({ where: { key: 'cp_name' } });
    const cpWaSettings = await this.prisma.settings.findUnique({ where: { key: 'cp_whatsapp' } });

    const cpName = cpNameSettings?.value || 'Admin N-KGTS';
    const cpWa = cpWaSettings?.value || '6281234567890';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationLink = `${frontendUrl}/register?token=${token}`;

    const mailHtmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d8abc; margin: 0;">N-KGTS LMS Platform</h2>
          <p style="color: #777; margin: 5px 0 0 0;">Pembelajaran Budaya Kaizen & 5R</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
        <p>Halo, <strong>${nama}</strong>!</p>
        <p>Anda telah diundang sebagai <strong>${role.toUpperCase()}</strong> di sekolah <strong>${namaSekolah}</strong> untuk bergabung dalam platform LMS N-KGTS.</p>
        <p>Silakan klik tautan di bawah ini untuk mengaktifkan akun Anda dan mengatur password masuk baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #0d8abc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Aktifkan Akun Saya</a>
        </div>
        <p style="color: #555; font-size: 13px;">Tautan ini hanya berlaku selama 7 hari. Jika tautan kedaluwarsa, silakan hubungi Admin Sekolah Anda.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px; margin-bottom: 15px;" />
        <div style="font-size: 12px; color: #777;">
          <p>Butuh bantuan? Hubungi Contact Person kami:</p>
          <p>Nama: <strong>${cpName}</strong><br />WhatsApp: <a href="https://wa.me/${cpWa}" style="color: #0d8abc; text-decoration: none;">+${cpWa}</a></p>
        </div>
      </div>
    `;

    // 1. Coba Mengirim Lewat Brevo API (HTTPS Port 443, gratis 300 email/hari & mendukung verifikasi satu email Gmail/Sekolah tanpa domain kustom)
    if (hasBrevo) {
      const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Platform N-KGTS LMS';
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: brevoSenderName,
              email: brevoSenderEmail,
            },
            to: [{ email, name: nama }],
            subject: 'Undangan Aktivasi Akun Platform N-KGTS LMS',
            htmlContent: mailHtmlContent,
          }),
          signal: AbortSignal.timeout(5000), // Timeout 5 detik
        });

        if (response.ok) {
          console.log('Email undangan berhasil dikirim via Brevo API ke:', email);
          return undefined; // Sukses
        } else {
          const errData = await response.json();
          const errMsg = errData.message || 'Error API Brevo';
          console.error('Gagal mengirim email via Brevo API:', errData);
          if (!hasGmail) {
            return `Brevo API: ${errMsg}`;
          }
        }
      } catch (err: any) {
        console.error('Error saat menghubungi API Brevo:', err);
        if (!hasGmail) {
          return `Brevo API: ${err.message || 'Koneksi timeout'}`;
        }
      }
    }

    // 3. Fallback ke Gmail SMTP (dengan timeout 5 detik)
    if (hasGmail) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
        connectionTimeout: 5000, // Timeout koneksi 5 detik
        greetingTimeout: 5000,
        socketTimeout: 5000,
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `"Platform N-KGTS LMS" <${gmailUser}>`,
        to: email,
        subject: 'Undangan Aktivasi Akun Platform N-KGTS LMS',
        html: mailHtmlContent,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email undangan berhasil dikirim via Gmail SMTP ke:', email);
        return undefined; // Sukses
      } catch (err: any) {
        console.error('Gagal mengirim email undangan via Gmail SMTP ke:', email, err);
        return `Gmail SMTP: ${err.message || 'Koneksi timeout'}`;
      }
    }

    return 'Gagal memproses pengiriman email.';
  }

  // 2. Buat Token Baru & Kirim Email (Proses Utama)
  private async createTokenAndInvite(
    email: string,
    nama: string,
    role: RoleEnum,
    sekolahId: number,
    nis?: string,
  ) {
    const emailLower = email.toLowerCase();

    // Validasi apakah user dengan email ini sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({ where: { email: emailLower } });
    if (existingUser) {
      throw new ConflictException(`Pengguna dengan email ${email} sudah aktif terdaftar di sistem`);
    }

    // Ambil detail sekolah
    const sekolah = await this.prisma.sekolah.findUnique({ where: { id: sekolahId } });
    if (!sekolah) {
      throw new NotFoundException(`Sekolah dengan ID ${sekolahId} tidak ditemukan`);
    }

    // Cek jika sudah ada invitation token lama yang belum terpakai, hapus dulu
    await this.prisma.invitationToken.deleteMany({
      where: { email: emailLower, is_used: false },
    });

    // Buat token aktivasi acak 64 karakter heksadesimal
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Kedaluwarsa dalam 7 hari

    // Simpan ke database
    const inviteToken = await this.prisma.invitationToken.create({
      data: {
        email: emailLower,
        token,
        role,
        nama,
        nis: nis || null,
        sekolah_id: sekolahId,
        expires_at: expiresAt,
      },
    });

    // Kirim email undangan secara sinkron dengan batas timeout 5 detik
    const emailError = await this.sendInvitationEmail(emailLower, nama, token, role, sekolah.nama_sekolah);

    return {
      ...inviteToken,
      emailError: emailError || null
    };
  }

  // 3. Undang Pengguna Secara Manual
  async inviteManual(dto: InviteUserDto) {
    return this.createTokenAndInvite(dto.email, dto.nama, dto.role, dto.sekolah_id, dto.nis);
  }

  // 4. Pengunggahan Pengguna Massal via File (Excel / CSV)
  async importUsers(file: Express.Multer.File, sekolahId: number) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    let records: any[] = [];

    try {
      if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
        // Parsing format Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        records = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.originalname.endsWith('.csv')) {
        // Parsing format CSV
        const csvContent = file.buffer.toString('utf-8');
        records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
      } else {
        throw new BadRequestException('Format file tidak didukung. Unggah file .xlsx atau .csv');
      }
    } catch (err: any) {
      throw new BadRequestException(`Gagal membaca file: ${err.message}`);
    }

    const summary = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Validasi & Simpan setiap record secara sekuensial
    for (const [index, row] of records.entries()) {
      const email = row.Email || row.email || row.EMAIL;
      const nama = row.Nama || row.nama || row.NAMA || row.Name || row.name;
      let roleRaw = row.Role || row.role || row.ROLE || 'siswa';
      const nis = row.Nis || row.nis || row.NIS || row['Nomor Induk Siswa'] || null;

      const lineNumber = index + 2; // Baris Excel biasanya 1-based header = baris 1

      if (!email || !nama) {
        summary.failed++;
        summary.errors.push(`Baris ${lineNumber}: Kolom 'Email' dan 'Nama' wajib diisi.`);
        continue;
      }

      // Standarisasi role enum
      let role: RoleEnum = RoleEnum.siswa;
      roleRaw = roleRaw.trim().toLowerCase();
      if (roleRaw === 'admin') role = RoleEnum.admin;
      else if (roleRaw === 'guru') role = RoleEnum.guru;

      try {
        await this.createTokenAndInvite(email, nama, role, sekolahId, nis?.toString());
        summary.success++;
      } catch (err: any) {
        summary.failed++;
        summary.errors.push(`Baris ${lineNumber} (${email}): ${err.message}`);
      }
    }

    return {
      message: `Proses import selesai. Berhasil: ${summary.success}, Gagal: ${summary.failed}`,
      data: summary,
    };
  }

  // 5. Ambil Daftar Pengguna Aktif (Terpaginasi & Filter)
  async getActiveUsers(page = 1, limit = 10, search = '', role?: RoleEnum) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { sekolah: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nis: user.nis,
        nama_sekolah: user.sekolah?.nama_sekolah || 'N-KGTS Pusat',
        created_at: user.created_at,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // 6. Ambil Daftar Undangan Belum Aktif (Tertunda)
  async getPendingInvitations() {
    const invitations = await this.prisma.invitationToken.findMany({
      where: { is_used: false },
      orderBy: { created_at: 'desc' },
      include: { sekolah: true },
    });

    return invitations.map(invite => ({
      id: invite.id,
      nama: invite.nama,
      email: invite.email,
      role: invite.role,
      nis: invite.nis,
      nama_sekolah: invite.sekolah.nama_sekolah,
      created_at: invite.created_at,
      expires_at: invite.expires_at,
      is_expired: new Date() > invite.expires_at,
      token: invite.token,
    }));
  }

  // 7. Batalkan / Hapus Undangan
  async deleteInvitation(id: number) {
    const invite = await this.prisma.invitationToken.findUnique({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Data undangan tidak ditemukan');
    }
    if (invite.is_used) {
      throw new BadRequestException('Undangan yang sudah digunakan tidak dapat dihapus');
    }

    await this.prisma.invitationToken.delete({ where: { id } });
    return { message: 'Undangan berhasil dibatalkan dan dihapus' };
  }

  // 8. Kirim Ulang Email Undangan (Regenerasi Token)
  async resendInvitation(id: number) {
    const invite = await this.prisma.invitationToken.findUnique({
      where: { id },
      include: { sekolah: true },
    });

    if (!invite) {
      throw new NotFoundException('Data undangan tidak ditemukan');
    }
    if (invite.is_used) {
      throw new BadRequestException('Akun ini sudah aktif, email undangan tidak dapat dikirim ulang');
    }

    // Regenerasi Token & Masa Kedaluwarsa
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updatedInvite = await this.prisma.invitationToken.update({
      where: { id },
      data: {
        token: newToken,
        expires_at: newExpiresAt,
        created_at: new Date(), // Reset waktu pengiriman
      },
    });

    // Kirim Ulang Email secara sinkron dengan batas timeout 5 detik
    const emailError = await this.sendInvitationEmail(
      invite.email,
      invite.nama,
      newToken,
      invite.role,
      invite.sekolah.nama_sekolah,
    );

    return {
      message: emailError
        ? `Undangan berhasil diperbarui, tetapi gagal mengirim email: ${emailError}`
        : 'Email undangan berhasil dikirim ulang dengan token baru',
      data: updatedInvite,
      emailError: emailError || null
    };
  }

  // 9. Ambil Kontak Pengaturan CP
  async getContactSettings() {
    const cpName = await this.prisma.settings.findUnique({ where: { key: 'cp_name' } });
    const cpWa = await this.prisma.settings.findUnique({ where: { key: 'cp_whatsapp' } });

    return {
      cp_name: cpName?.value || 'Admin N-KGTS',
      cp_whatsapp: cpWa?.value || '6281234567890',
    };
  }

  // 10. Edit Kontak Pengaturan CP
  async updateContactSettings(dto: UpdateContactDto) {
    await this.prisma.settings.upsert({
      where: { key: 'cp_name' },
      update: { value: dto.cp_name },
      create: { key: 'cp_name', value: dto.cp_name },
    });

    await this.prisma.settings.upsert({
      where: { key: 'cp_whatsapp' },
      update: { value: dto.cp_whatsapp },
      create: { key: 'cp_whatsapp', value: dto.cp_whatsapp },
    });

    return {
      message: 'Pengaturan kontak person berhasil diperbarui',
      data: dto,
    };
  }

  // 11. Validasi Token Aktivasi (Halaman Registrasi Publik)
  async validateActivationToken(token: string) {
    const invite = await this.prisma.invitationToken.findUnique({
      where: { token },
      include: { sekolah: true },
    });

    if (!invite) {
      throw new NotFoundException('Token aktivasi tidak valid atau tidak terdaftar');
    }
    if (invite.is_used) {
      throw new BadRequestException('Token aktivasi sudah pernah digunakan');
    }
    if (new Date() > invite.expires_at) {
      throw new BadRequestException('Masa berlaku token aktivasi telah kedaluwarsa');
    }

    return {
      email: invite.email,
      nama: invite.nama,
      role: invite.role,
      nis: invite.nis,
      id_sekolah: invite.sekolah_id,
      nama_sekolah: invite.sekolah.nama_sekolah,
    };
  }

  // 12. Aktivasi Akun (Mendaftarkan Password & Memulai Sesi Login)
  async activateAccount(dto: ActivateAccountDto) {
    const tokenInfo = await this.validateActivationToken(dto.token);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Jalankan transaksi: Simpan User baru & Tandai token telah terpakai
    const newUser = await this.prisma.$transaction(async (tx) => {
      // Buat user baru
      const user = await tx.user.create({
        data: {
          email: tokenInfo.email,
          nama: tokenInfo.nama,
          password_hash: hashedPassword,
          role: tokenInfo.role,
          sekolah_id: tokenInfo.id_sekolah,
          nis: tokenInfo.nis,
        },
        include: { sekolah: true },
      });

      // Update status token menjadi terpakai
      await tx.invitationToken.update({
        where: { token: dto.token },
        data: { is_used: true },
      });

      return user;
    });

    // Langsung buat response auth berisi JWT access_token agar user langsung login
    const authResponse = this.authService['buildAuthResponse'](newUser);

    return {
      ...authResponse,
      message: 'Akun Anda berhasil diaktifkan. Selamat datang!',
    };
  }

  // 11. Memperbarui role pengguna aktif (admin, guru, siswa)
  async updateUserRole(userId: string, role: RoleEnum) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  // 12. Menghapus pengguna aktif
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // 13. Reset progres belajar parsial/sekuensial
  async resetProgress(userId: string, startFromModule: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    await Promise.all([
      // 1. progres_teori >= startFromModule
      this.prisma.progresTeori.deleteMany({
        where: {
          siswa_id: userId,
          modul_teori: {
            urutan: {
              gte: startFromModule,
            },
          },
        },
      }),

      // 2. nilai_latsol >= startFromModule
      this.prisma.nilaiLatsol.deleteMany({
        where: {
          siswa_id: userId,
          modul_teori: {
            urutan: {
              gte: startFromModule,
            },
          },
        },
      }),

      // 3. submisi_praktek >= startFromModule
      this.prisma.submisiPraktek.deleteMany({
        where: {
          siswa_id: userId,
          tugas_praktek: {
            urutan: {
              gte: startFromModule,
            },
          },
        },
      }),

      // 4. nilai_latihan >= startFromModule
      this.prisma.nilaiLatihan.deleteMany({
        where: {
          siswa_id: userId,
          modul_teori: {
            urutan: {
              gte: startFromModule,
            },
          },
        },
      }),
    ]);

    return {
      message: `Progres belajar siswa dari Modul ${startFromModule} s/d Modul 5 berhasil direset!`,
    };
  }
}
