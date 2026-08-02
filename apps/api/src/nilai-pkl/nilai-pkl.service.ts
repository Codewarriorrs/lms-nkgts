import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubmitNilaiPklDto } from './dto/submit-nilai-pkl.dto';
import { RoleEnum } from '../../generated/prisma';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NilaiPklService {
  constructor(private readonly prisma: PrismaService) {}

  async submitGrade(penilaiId: string, dto: SubmitNilaiPklDto) {
    const student = await this.prisma.user.findFirst({
      where: { id: dto.siswa_id, role: RoleEnum.siswa },
      include: { sekolah: true },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    // Upsert grade
    const grade = await this.prisma.nilaiPkl.upsert({
      where: { siswa_id: dto.siswa_id },
      update: {
        nilai: dto.nilai,
        detail_nilai: dto.detail_nilai,
        catatan: dto.catatan || null,
        rekomendasi: dto.rekomendasi,
        penilai_id: penilaiId,
      },
      create: {
        siswa_id: dto.siswa_id,
        nilai: dto.nilai,
        detail_nilai: dto.detail_nilai,
        catatan: dto.catatan || null,
        rekomendasi: dto.rekomendasi,
        penilai_id: penilaiId,
      },
    });

    // Send email notification to student asynchronously (don't block the API response)
    this.sendNotificationEmail(student.email, student.nama, dto.nilai, dto.rekomendasi).catch((err) => {
      console.error('Failed to send PKL Grade notification email:', err);
    });

    return {
      status: 'success',
      message: 'Penilaian PKL berhasil disimpan',
      data: grade,
    };
  }

  async getStudentsList(
    user: any,
    page: number = 1,
    limit: number = 50,
    search?: string,
    schoolId?: number,
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: RoleEnum.siswa,
    };

    // Filter by school
    if (user.role === RoleEnum.guru) {
      // Guru is scoped strictly to their own school
      if (!user.sekolah_id) {
        throw new BadRequestException('Guru tidak terikat dengan sekolah mana pun');
      }
      whereClause.sekolah_id = user.sekolah_id;
    } else if (user.role === RoleEnum.admin && schoolId) {
      // Admin can filter by school
      whereClause.sekolah_id = Number(schoolId);
    }

    // Filter by name search
    if (search) {
      whereClause.nama = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          nama: true,
          email: true,
          nis: true,
          kelas: true,
          sekolah: {
            select: {
              nama_sekolah: true,
            },
          },
          nilai_pkl: {
            select: {
              nilai: true,
              rekomendasi: true,
              detail_nilai: true,
              catatan: true,
              updated_at: true,
            },
          },
        },
        orderBy: { nama: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      status: 'success',
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyGrade(studentId: string) {
    const grade = await this.prisma.nilaiPkl.findUnique({
      where: { siswa_id: studentId },
      include: {
        siswa: {
          select: {
            nama: true,
            email: true,
            nis: true,
            kelas: true,
            sekolah: {
              select: {
                nama_sekolah: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('Penilaian PKL Anda belum diterbitkan.');
    }

    return {
      status: 'success',
      data: grade,
    };
  }

  private async sendNotificationEmail(
    email: string,
    nama: string,
    nilai: number,
    rekomendasi: string,
  ) {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;

    const hasBrevo = !!brevoApiKey && !!brevoSenderEmail;
    const hasGmail = gmailUser && gmailPass && !gmailUser.includes('placeholder') && !gmailPass.includes('placeholder');

    if (!hasBrevo && !hasGmail) {
      console.warn('Mail configuration is missing. Cannot send grade email.');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectLink = `${frontendUrl}/dashboard/nilai-pkl`;

    const mailHtmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d8abc; margin: 0;">N-KGTS LMS Platform</h2>
          <p style="color: #777; margin: 5px 0 0 0;">Laporan Kelulusan & Penilaian PKL</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
        <p>Halo, <strong>${nama}</strong>!</p>
        <p>Penilaian PKL Anda telah diterbitkan oleh pembimbing magang Anda dengan hasil sebagai berikut:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <span style="font-size: 14px; color: #555; display: block; margin-bottom: 5px;">Nilai Evaluasi Akhir</span>
          <strong style="font-size: 32px; color: #0d8abc;">${nilai}</strong>
          <span style="display: block; font-size: 14px; color: #777; margin-top: 5px; font-weight: bold;">
            Rekomendasi: ${rekomendasi}
          </span>
        </div>

        <p>Silakan klik tautan di bawah ini untuk melihat detail lengkap transkrip nilai PKL (DEKKI) Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${redirectLink}" style="background-color: #0d8abc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Lihat Nilai PKL Saya</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px; margin-bottom: 15px;" />
        <div style="font-size: 12px; color: #777; text-align: center;">
          <p>Email ini dikirim otomatis oleh Platform N-KGTS LMS.</p>
        </div>
      </div>
    `;

    const subject = 'Penilaian PKL Anda Telah Diterbitkan';

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
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email, name: nama }],
            subject,
            htmlContent: mailHtmlContent,
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          console.log('Email nilai PKL berhasil dikirim via Brevo API ke:', email);
          return;
        }
      } catch (err) {
        console.error('Error sending email via Brevo API:', err);
      }
    }

    if (hasGmail) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: gmailUser, pass: gmailPass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: `"Platform N-KGTS LMS" <${gmailUser}>`,
        to: email,
        subject,
        html: mailHtmlContent,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email nilai PKL berhasil dikirim via Gmail SMTP ke:', email);
      } catch (err) {
        console.error('Gagal mengirim email nilai PKL via Gmail SMTP ke:', email, err);
      }
    }
  }
}
