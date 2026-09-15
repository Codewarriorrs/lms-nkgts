import { Injectable, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { RoleEnum } from '../../generated/prisma';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import * as bcrypt from 'bcryptjs';
import { INVALID_SCHOOL_NAMES, isInvalidSchoolName } from '../school.utils';

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
    let rawCpWa = cpWaSettings?.value || '6281234567890';
    let cpWa = rawCpWa.replace(/\D/g, '');
    if (cpWa.startsWith('0')) {
      cpWa = '62' + cpWa.slice(1);
    }
    if (!cpWa) cpWa = '6281234567890';

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

    // 1. Coba Mengirim Lewat Brevo API Terlebih Dahulu
    if (hasBrevo) {
      const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Kaizenesia';
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
            subject: 'Undangan Aktivasi Akun - Kaizenesia',
            htmlContent: mailHtmlContent,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          console.log('Email undangan berhasil dikirim via Brevo API ke:', email);
          return undefined;
        } else {
          const errData = await response.json();
          const errMsg = errData.message || 'Error API Brevo';
          console.error('Gagal mengirim email via Brevo API:', errData);
          if (!hasGmail) return `Brevo API: ${errMsg}`;
        }
      } catch (err: any) {
        console.error('Error saat menghubungi API Brevo:', err);
        if (!hasGmail) return `Brevo API: ${err.message || 'Koneksi timeout'}`;
      }
    }

    // 2. Fallback ke Gmail SMTP (jika Brevo API tidak aktif/gagal)
    if (hasGmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
          tls: {
            rejectUnauthorized: false
          }
        });

        await transporter.sendMail({
          from: `"Kaizenesia" <${gmailUser}>`,
          to: email,
          subject: 'Undangan Aktivasi Akun - Kaizenesia',
          html: mailHtmlContent,
        });

        console.log('Email undangan berhasil dikirim via Gmail SMTP fallback ke:', email);
        return undefined;
      } catch (err: any) {
        console.error('Gagal mengirim email via Gmail SMTP fallback:', err);
        return `Gmail SMTP: ${err.message || 'Gagal mengirim email'}`;
      }
    }

    return 'Gagal memproses pengiriman email.';
  }

  // Helper normalisasi nama sekolah & kalkulasi tahun angkatan
  private normalizeSchoolName(name: string): string {
    if (!name) return '';
    let clean = name.trim().replace(/\s+/g, ' ');
    clean = clean.replace(/\bSMKN\b/gi, 'SMK Negeri');
    clean = clean.replace(/\bSMK\s+N\b/gi, 'SMK Negeri');
    clean = clean.replace(/\bSMK\s*NEGERI\b/gi, 'SMK Negeri');
    return clean;
  }

  private calculateGraduationYear(kelas?: string): number | undefined {
    if (!kelas) return undefined;
    const currentYear = new Date().getFullYear();
    const kUpper = kelas.toUpperCase();

    if (/\b(XII|12|XIII|13)\b/i.test(kUpper) || kUpper.includes('KELAS 12') || kUpper.includes('KELAS XII')) {
      return currentYear;
    }
    if (/\b(XI|11)\b/i.test(kUpper) || kUpper.includes('KELAS 11') || kUpper.includes('KELAS XI')) {
      return currentYear + 1;
    }
    if (/\b(X|10)\b/i.test(kUpper) || kUpper.includes('KELAS 10') || kUpper.includes('KELAS X')) {
      return currentYear + 2;
    }
    return undefined;
  }

  private parseExcelDate(val: any): Date | undefined {
    if (!val) return undefined;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'number') {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) return d;
    }
    const str = String(val).trim();
    if (!str) return undefined;

    let parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;

    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return undefined;
  }

  // 2. Buat Token Baru & Kirim Email (Proses Utama)
  private async createTokenAndInvite(
    email: string,
    nama: string,
    role: RoleEnum,
    sekolahId: number,
    nis?: string,
    kelas?: string,
    jurusan?: string,
    no_hp?: string,
    tanggal_lahir?: Date | string,
    tempat_lahir?: string,
    tahun_pendaftaran?: number,
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

    // Hapus semua invitation token lama untuk email ini agar token baru sepenuhnya bersih
    await this.prisma.invitationToken.deleteMany({
      where: { email: emailLower },
    });

    // Buat token aktivasi acak 64 karakter heksadesimal
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Kedaluwarsa dalam 7 hari

    const tglLahirDate = tanggal_lahir ? new Date(tanggal_lahir) : undefined;
    const validTglLahir = tglLahirDate && !isNaN(tglLahirDate.getTime()) ? tglLahirDate : null;

    // Simpan ke database
    let inviteToken;
    try {
      inviteToken = await this.prisma.invitationToken.create({
        data: {
          email: emailLower,
          token,
          role,
          nama,
          nis: nis || null,
          kelas: kelas || null,
          jurusan: jurusan || null,
          no_hp: no_hp || null,
          tanggal_lahir: validTglLahir,
          tempat_lahir: tempat_lahir || null,
          tahun_pendaftaran: tahun_pendaftaran || null,
          sekolah_id: sekolahId,
          expires_at: expiresAt,
        },
      });
    } catch (err: any) {
      if (err?.message?.includes('tanggal_lahir') || err?.message?.includes('no_hp')) {
        inviteToken = await this.prisma.invitationToken.create({
          data: {
            email: emailLower,
            token,
            role,
            nama,
            nis: nis || null,
            kelas: kelas || null,
            jurusan: jurusan || null,
            sekolah_id: sekolahId,
            expires_at: expiresAt,
          },
        });
      } else {
        throw err;
      }
    }

    // Kirim email undangan secara sinkron dengan batas timeout 5 detik
    const emailError = await this.sendInvitationEmail(emailLower, nama, token, role, sekolah.nama_sekolah);

    return {
      ...inviteToken,
      emailError: emailError || null
    };
  }

  // 3. Undang Pengguna Secara Manual
  async inviteManual(dto: InviteUserDto) {
    const autoTahun = dto.tahun_pendaftaran || this.calculateGraduationYear(dto.kelas);
    return this.createTokenAndInvite(
      dto.email, 
      dto.nama, 
      dto.role, 
      dto.sekolah_id, 
      dto.nis, 
      dto.kelas, 
      dto.jurusan,
      dto.no_hp,
      dto.tanggal_lahir,
      dto.tempat_lahir,
      autoTahun
    );
  }

  // 4. Pengunggahan Pengguna Massal via File (Excel / CSV)
  async importUsers(file: Express.Multer.File, sekolahId?: number) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    let records: any[] = [];

    try {
      if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
        // Parsing format Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
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

    // Ambil data daftar sekolah di database untuk pencocokan otomatis (hanya yang valid)
    const allSekolah = (await this.prisma.sekolah.findMany()).filter(s => !isInvalidSchoolName(s.nama_sekolah));

    // Validasi & Simpan setiap record secara sekuensial
    for (const [index, row] of records.entries()) {
      const lineNumber = index + 2; // Baris Excel (1-based header = baris 1)

      if (!row || typeof row !== 'object') continue;

      // Map key dictionary dengan normalisasi spasi & case-insensitive
      const keyMap = new Map<string, any>();
      for (const [k, v] of Object.entries(row)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          const cleanK = String(k).trim().toLowerCase().replace(/[\s\-_/]+/g, '');
          keyMap.set(cleanK, v);
        }
      }

      // Helper pencocokan nilai kolom dengan fallback multi-kandidat
      const getVal = (candidates: string[], excludeKeywords: string[] = []): any => {
        // Phase 1: Exact Key Match
        for (const cand of candidates) {
          const cleanCand = cand.toLowerCase().replace(/[\s\-_/]+/g, '');
          if (keyMap.has(cleanCand)) {
            return keyMap.get(cleanCand);
          }
        }
        // Phase 2: Infix Contains Match
        for (const cand of candidates) {
          const cleanCand = cand.toLowerCase().replace(/[\s\-_/]+/g, '');
          for (const [k, v] of keyMap.entries()) {
            const isExcluded = excludeKeywords.some(ex => k.includes(ex.toLowerCase()));
            if (!isExcluded && k.includes(cleanCand)) {
              return v;
            }
          }
        }
        // Phase 2: Prefix/Suffix Match
        for (const cand of candidates) {
          const cleanCand = cand.toLowerCase().replace(/[\s\-_/]+/g, '');
          for (const [k, v] of keyMap.entries()) {
            const isExcluded = excludeKeywords.some(ex => k.includes(ex.toLowerCase()));
            if (!isExcluded && (k.startsWith(cleanCand) || k.endsWith(cleanCand))) {
              return v;
            }
          }
        }
        return '';
      };

      // 1. Deteksi Email
      const emailRaw = getVal(['emailaktif', 'email', 'emailaddress', 'e-mail', 'mail', 'alamatemail']);
      const emailStr = emailRaw ? String(emailRaw).trim() : '';

      // 2. Deteksi Nama Siswa / Pengguna / Praktisi
      let namaRaw = getVal(
        ['namapraktisi', 'namaguru', 'namalengkap', 'nama', 'namasiswa', 'name', 'namasiswa/i', 'namapeserta', 'namamurid', 'praktisi'],
        ['jurusan', 'sga', 'sekolah', 'email', 'kelas', 'kelamin', 'lahir', 'whatsapp', 'phone', 'sgajurusan']
      );
      let namaStr = namaRaw ? String(namaRaw).trim() : '';

      if (!namaStr) {
        const col1 = getVal(['column1', 'col1', 'kolom1']);
        if (col1 && isNaN(Number(col1))) {
          namaStr = String(col1).trim();
        }
      }

      // 3. Deteksi Role & Jabatan
      let roleRaw = getVal(['role', 'peran', 'jabatan', 'posisi', 'status', 'profesi', 'jabatandisekolah', 'jabatandisga']);
      if (!roleRaw) {
        for (const [k, v] of keyMap.entries()) {
          if (k.includes('jabatan') || k.includes('posisi') || k.includes('peran') || k.includes('role')) {
            if (v && String(v).trim() !== '') {
              roleRaw = v;
              break;
            }
          }
        }
      }

      // 4. Deteksi Asal Sekolah
      const sekolahRaw = getVal(['asalsekolah', 'sekolah', 'namasekolah', 'instansi', 'school']);

      // 5. Deteksi NIS
      let nisRaw = getVal(['nis', 'nisn', 'nomorinduk', 'nomorinduksiswa', 'noinduk']);
      let nis = nisRaw ? String(nisRaw).trim() : '';
      if (!nis) {
        const col1 = getVal(['column1', 'col1', 'kolom1']);
        if (col1 && !isNaN(Number(col1))) {
          nis = String(col1).trim();
        }
      }

      // 6. Deteksi Kelas
      const kelasRaw = getVal(['kelassaatmendaftar', 'kelas', 'class', 'tingkat']);
      const kelas = kelasRaw ? String(kelasRaw).trim() : '';

      // 7. Deteksi Jurusan / SGA
      const jurusanRaw = getVal(['namasgajurusan', 'namasga', 'namajurusan', 'jurusan', 'sga', 'prodi', 'programkeahlian', 'kompetensikeahlian']);
      const jurusan = jurusanRaw ? String(jurusanRaw).trim() : '';

      // 8. Deteksi No HP / WhatsApp / Telepon
      const noHpRaw = getVal(['nohp', 'nowa', 'whatsapp', 'nomorhp', 'nomorwhatsapp', 'telepon', 'phone', 'no_hp', 'no_wa', 'hp', 'wa', 'notlp', 'notelp', 'telp', 'tlp']);
      const noHp = noHpRaw ? String(noHpRaw).trim() : '';

      // 9. Deteksi Tanggal Lahir
      const tglLahirRaw = getVal(['tanggallahir', 'tgllahir', 'birthdate', 'dob', 'tgl_lahir', 'tanggal_lahir', 'tgl_lh', 'tgl_lahir_siswa']);
      const parsedTglLahir = this.parseExcelDate(tglLahirRaw);

      // 10. Deteksi Tempat Lahir
      const tempatLahirRaw = getVal(['tempatlahir', 'birthplace', 'tempat_lahir', 'tmpt_lahir', 'kota_lahir']);
      const tempatLahir = tempatLahirRaw ? String(tempatLahirRaw).trim() : '';

      // 11. Deteksi / Kalkulasi Tahun Angkatan (Tahun Lulus)
      const tahunRaw = getVal(['tahunpendaftaran', 'tahunangkatan', 'tahunlulus', 'angkatan', 'tahun_angkatan', 'tahun_pendaftaran']);
      let tahunAngkatan = tahunRaw && !isNaN(Number(tahunRaw)) ? parseInt(String(tahunRaw).trim(), 10) : undefined;
      if (!tahunAngkatan) {
        tahunAngkatan = this.calculateGraduationYear(kelas);
      }

      // Validasi Field Wajib: Email dan Nama
      if (!emailStr || !namaStr) {
        summary.failed++;
        summary.errors.push(`Baris ${lineNumber}: Kolom 'Email' dan 'Nama' wajib diisi (ditemukan email: "${emailStr || '-'}", nama: "${namaStr || '-'}").`);
        continue;
      }

      // Validasi Field Wajib: Asal Sekolah & Auto Match dengan Normalisasi dan Guard Blacklist
      let targetSekolahId: number | undefined = sekolahId && !isNaN(sekolahId) && sekolahId > 0 ? sekolahId : undefined;
      const sekolahStr = sekolahRaw ? String(sekolahRaw).trim() : '';
      const isSekolahInvalid = isInvalidSchoolName(sekolahStr);

      if (sekolahStr && !isSekolahInvalid) {
        const normSekolahInput = this.normalizeSchoolName(sekolahStr);
        const isNormInvalid = isInvalidSchoolName(normSekolahInput);

        const matched = allSekolah.find(s => {
          if (isInvalidSchoolName(s.nama_sekolah)) return false;
          const normDB = this.normalizeSchoolName(s.nama_sekolah);
          return (
            normDB.toLowerCase() === normSekolahInput.toLowerCase() ||
            normDB.toLowerCase().includes(normSekolahInput.toLowerCase()) ||
            normSekolahInput.toLowerCase().includes(normDB.toLowerCase())
          );
        });

        if (matched) {
          targetSekolahId = matched.id;
        } else if (!isNormInvalid) {
          try {
            const newSekolah = await this.prisma.sekolah.create({
              data: { nama_sekolah: normSekolahInput || sekolahStr },
            });
            allSekolah.push(newSekolah);
            targetSekolahId = newSekolah.id;
          } catch (e) {
            const existing = await this.prisma.sekolah.findFirst({
              where: { nama_sekolah: { equals: normSekolahInput || sekolahStr, mode: 'insensitive' } },
            });
            if (existing && !isInvalidSchoolName(existing.nama_sekolah)) {
              targetSekolahId = existing.id;
            }
          }
        }
      } else if (isSekolahInvalid && !targetSekolahId) {
        // Jika nama sekolah masuk blacklist (misal header "ASAL SEKOLAH") dan tidak ada sekolahId dari form,
        // gunakan ID sekolah valid pertama sebagai fallback aman
        const defaultValidSekolah = allSekolah.find(s => !isInvalidSchoolName(s.nama_sekolah));
        if (defaultValidSekolah) {
          targetSekolahId = defaultValidSekolah.id;
        }
      }

      if (!targetSekolahId) {
        summary.failed++;
        summary.errors.push(`Baris ${lineNumber} (${emailStr}): Kolom 'Asal Sekolah' tidak valid atau wajib diisi pada file Excel/CSV.`);
        continue;
      }

      // Deteksi Cerdas Role Guru/Praktisi vs Siswa
      const hasPraktisiCol = Array.from(keyMap.keys()).some(
        k => k.includes('praktisi') || k === 'namapraktisi' || k === 'namaguru'
      );

      // Regex fleksibel kata kunci jabatan / peran guru & praktisi
      const guruKeywordRegex = /guru|bk|konseling|kaprodi|pengajar|kepala|wakasek|koordinator|pembimbing|instruktur|praktisi|notulen|fasilitator|leader/i;

      // Kumpulkan seluruh teks indikator jabatan/peran dari kolom baris tersebut
      const jabatanValues: string[] = [];
      if (roleRaw) jabatanValues.push(String(roleRaw));
      for (const [k, v] of keyMap.entries()) {
        if (k.includes('jabatan') || k.includes('posisi') || k.includes('peran') || k.includes('profesi') || k.includes('role')) {
          if (v && String(v).trim() !== '') {
            jabatanValues.push(String(v));
          }
        }
      }
      const combinedJabatanText = jabatanValues.join(' ');

      let role: RoleEnum = RoleEnum.siswa;

      if (/admin/i.test(String(roleRaw || '')) && !guruKeywordRegex.test(String(roleRaw || ''))) {
        role = RoleEnum.admin;
      } else if (hasPraktisiCol || guruKeywordRegex.test(combinedJabatanText)) {
        role = RoleEnum.guru;
      } else if (roleRaw) {
        const rLower = String(roleRaw).trim().toLowerCase();
        if (rLower === 'admin') role = RoleEnum.admin;
        else if (rLower === 'guru' || guruKeywordRegex.test(rLower)) role = RoleEnum.guru;
        else if (rLower === 'siswa') role = RoleEnum.siswa;
        else {
          role = RoleEnum.siswa;
        }
      }

      try {
        await this.createTokenAndInvite(
          emailStr,
          namaStr,
          role,
          targetSekolahId,
          nis || undefined,
          kelas || undefined,
          jurusan || undefined,
          noHp || undefined,
          parsedTglLahir,
          tempatLahir || undefined,
          tahunAngkatan
        );
        summary.success++;
      } catch (err: any) {
        summary.failed++;
        summary.errors.push(`Baris ${lineNumber} (${emailStr}): ${err.message}`);
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
      users: users.map(user => {
        const hasActiveResetToken = Boolean(
          user.reset_password_token &&
          user.reset_password_expires &&
          user.reset_password_expires > new Date()
        );

        return {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          nis: user.nis,
          kelas: user.kelas,
          jurusan: user.jurusan,
          no_hp: user.no_hp,
          tanggal_lahir: user.tanggal_lahir,
          tempat_lahir: user.tempat_lahir,
          tahun_pendaftaran: user.tahun_pendaftaran,
          sekolah_id: user.sekolah_id,
          nama_sekolah: user.sekolah?.nama_sekolah || 'N-KGTS Pusat',
          created_at: user.created_at,
          reset_password_expires: user.reset_password_expires,
          has_active_reset_token: hasActiveResetToken,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // 6. Lihat Daftar Undangan Tertunda (Pending)
  async getPendingInvitations() {
    const invites = await this.prisma.invitationToken.findMany({
      where: { is_used: false },
      orderBy: { created_at: 'desc' },
      include: { sekolah: true },
    });

    return invites.map(invite => ({
      id: invite.id,
      nama: invite.nama,
      email: invite.email,
      role: invite.role,
      nis: invite.nis,
      kelas: invite.kelas,
      jurusan: invite.jurusan,
      no_hp: invite.no_hp,
      tanggal_lahir: invite.tanggal_lahir,
      tempat_lahir: invite.tempat_lahir,
      tahun_pendaftaran: invite.tahun_pendaftaran,
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
    let sanitizedWa = (dto.cp_whatsapp || '').replace(/\D/g, '');
    if (sanitizedWa.startsWith('0')) {
      sanitizedWa = '62' + sanitizedWa.slice(1);
    }
    if (!sanitizedWa) sanitizedWa = dto.cp_whatsapp;

    await this.prisma.settings.upsert({
      where: { key: 'cp_name' },
      update: { value: dto.cp_name },
      create: { key: 'cp_name', value: dto.cp_name },
    });

    await this.prisma.settings.upsert({
      where: { key: 'cp_whatsapp' },
      update: { value: sanitizedWa },
      create: { key: 'cp_whatsapp', value: sanitizedWa },
    });

    return {
      message: 'Pengaturan kontak person berhasil diperbarui',
      data: dto,
    };
  }

  // 11. Validasi Token Aktivasi (Halaman Registrasi Publik)
  async validateActivationToken(token: string) {
    const cleanToken = (token || '').trim();
    const invite = await this.prisma.invitationToken.findUnique({
      where: { token: cleanToken },
      include: { sekolah: true },
    });

    if (!invite) {
      throw new NotFoundException('Token aktivasi tidak valid atau tidak terdaftar');
    }
    if (invite.is_used) {
      throw new BadRequestException('Tautan aktivasi ini sudah pernah digunakan. Jika akun Anda telah dihapus oleh Admin, silakan minta Admin untuk mengirimkan Undangan Baru.');
    }
    if (new Date() > invite.expires_at) {
      throw new BadRequestException('Masa berlaku token aktivasi telah kedaluwarsa');
    }

    return {
      email: invite.email,
      nama: invite.nama,
      role: invite.role,
      nis: invite.nis,
      kelas: invite.kelas,
      jurusan: invite.jurusan,
      no_hp: invite.no_hp,
      tanggal_lahir: invite.tanggal_lahir,
      tempat_lahir: invite.tempat_lahir,
      tahun_pendaftaran: invite.tahun_pendaftaran,
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
          kelas: tokenInfo.kelas,
          jurusan: tokenInfo.jurusan,
          no_hp: tokenInfo.no_hp,
          tanggal_lahir: tokenInfo.tanggal_lahir,
          tempat_lahir: tokenInfo.tempat_lahir,
          tahun_pendaftaran: tokenInfo.tahun_pendaftaran,
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

  // 11. Memperbarui role dan data pengguna aktif (admin, guru, siswa)
  // 11. Memperbarui role dan data lengkap pengguna aktif (admin, guru, siswa)
  async updateUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    const updateData: any = {};
    if (dto.nama !== undefined && dto.nama.trim() !== '') {
      updateData.nama = dto.nama.trim();
    }
    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }
    if (dto.sekolah_id !== undefined && !isNaN(Number(dto.sekolah_id))) {
      updateData.sekolah_id = Number(dto.sekolah_id);
    }
    if (dto.nis !== undefined) {
      updateData.nis = dto.nis && dto.nis.trim() !== '' ? dto.nis.trim() : null;
    }
    if (dto.kelas !== undefined) {
      updateData.kelas = dto.kelas && dto.kelas.trim() !== '' ? dto.kelas.trim() : null;
    }
    if (dto.jurusan !== undefined) {
      updateData.jurusan = dto.jurusan && dto.jurusan.trim() !== '' ? dto.jurusan.trim() : null;
    }
    if (dto.no_hp !== undefined) {
      updateData.no_hp = dto.no_hp && dto.no_hp.trim() !== '' ? dto.no_hp.trim() : null;
    }
    if (dto.tempat_lahir !== undefined) {
      updateData.tempat_lahir = dto.tempat_lahir && dto.tempat_lahir.trim() !== '' ? dto.tempat_lahir.trim() : null;
    }
    if (dto.tanggal_lahir !== undefined) {
      if (dto.tanggal_lahir && dto.tanggal_lahir.trim() !== '') {
        const d = new Date(dto.tanggal_lahir);
        updateData.tanggal_lahir = !isNaN(d.getTime()) ? d : null;
      } else {
        updateData.tanggal_lahir = null;
      }
    }
    if (dto.tahun_pendaftaran !== undefined) {
      updateData.tahun_pendaftaran = dto.tahun_pendaftaran && !isNaN(Number(dto.tahun_pendaftaran)) ? Number(dto.tahun_pendaftaran) : null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { sekolah: true },
    });
  }

  // 11b. Helper kompatibilitas updateUserRole
  async updateUserRole(userId: string, role?: RoleEnum, kelas?: string | null) {
    return this.updateUser(userId, { role, kelas: kelas ?? undefined });
  }

  // 12. Menghapus pengguna aktif
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }
    // Hapus juga token undangan lama pengguna ini jika ada
    await this.prisma.invitationToken.deleteMany({
      where: { email: user.email.toLowerCase() },
    });

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // 13. Reset progres belajar parsial/sekuensial
  async resetProgress(userId: string, startFromModule: number, resetType: string = 'all') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    const tasks: Promise<any>[] = [];

    const shouldResetMateriLatsol = resetType === 'all' || resetType === 'materi_latsol';
    const shouldResetPraktik = resetType === 'all' || resetType === 'praktik';

    if (shouldResetMateriLatsol) {
      // 1. progres_teori >= startFromModule
      tasks.push(
        this.prisma.progresTeori.deleteMany({
          where: {
            siswa_id: userId,
            modul_teori: {
              urutan: { gte: startFromModule },
            },
          },
        }),
      );

      // 2. nilai_latsol >= startFromModule
      tasks.push(
        this.prisma.nilaiLatsol.deleteMany({
          where: {
            siswa_id: userId,
            modul_teori: {
              urutan: { gte: startFromModule },
            },
          },
        }),
      );

      // 3. nilai_latihan >= startFromModule
      tasks.push(
        this.prisma.nilaiLatihan.deleteMany({
          where: {
            siswa_id: userId,
            modul_teori: {
              urutan: { gte: startFromModule },
            },
          },
        }),
      );
    }

    if (shouldResetPraktik) {
      // 4. submisi_praktek >= startFromModule
      tasks.push(
        this.prisma.submisiPraktek.deleteMany({
          where: {
            siswa_id: userId,
            tugas_praktek: {
              urutan: { gte: startFromModule },
            },
          },
        }),
      );
    }

    await Promise.all(tasks);

    let typeDesc = 'seluruh progres (Materi, Kuis, & Tugas Praktik)';
    if (resetType === 'materi_latsol') typeDesc = 'Materi & Kuis/Latsol';
    else if (resetType === 'praktik') typeDesc = 'Tugas Praktik';

    return {
      message: `Berhasil mereset ${typeDesc} siswa dari Modul ${startFromModule} s/d Modul 5!`,
    };
  }

  // 12. Rekapitulasi Nilai Siswa (Export to Excel)
  async exportNilaiBuffer(sekolahId?: number): Promise<Buffer> {
    const whereClause: any = { role: RoleEnum.siswa };
    if (sekolahId) {
      whereClause.sekolah_id = sekolahId;
    }

    const students = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        sekolah: true,
        nilai_latsol: {
          include: {
            modul_teori: true,
          },
        },
      },
      orderBy: [
        { sekolah_id: 'asc' },
        { nama: 'asc' },
      ],
    });

    const rows = students.map((siswa) => {
      const scoresMap: Record<number, number> = {};
      siswa.nilai_latsol.forEach((item) => {
        if (item.modul_teori && item.modul_teori.urutan) {
          scoresMap[item.modul_teori.urutan] = item.skor;
        }
      });

      const m1 = scoresMap[1] ?? 0;
      const m2 = scoresMap[2] ?? 0;
      const m3 = scoresMap[3] ?? 0;
      const m4 = scoresMap[4] ?? 0;
      const m5 = scoresMap[5] ?? 0;

      const totalScore = m1 + m2 + m3 + m4 + m5;
      const averageScore = Math.round((totalScore / 5) * 10) / 10;

      return {
        'NIS': siswa.nis || '-',
        'Nama Siswa': siswa.nama,
        'Email': siswa.email,
        'Sekolah': siswa.sekolah?.nama_sekolah || '-',
        'Kelas': siswa.kelas || '-',
        'Jurusan / SGA': siswa.jurusan || '-',
        'Modul 1 (Latsol)': m1,
        'Modul 2 (Latsol)': m2,
        'Modul 3 (Latsol)': m3,
        'Modul 4 (Latsol)': m4,
        'Modul 5 (Latsol)': m5,
        'Rata-rata Skor (%)': averageScore,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Set auto column width
    const columnWidths = [
      { wch: 12 }, // NIS
      { wch: 25 }, // Nama Siswa
      { wch: 28 }, // Email
      { wch: 30 }, // Sekolah
      { wch: 15 }, // Kelas
      { wch: 18 }, // Modul 1
      { wch: 18 }, // Modul 2
      { wch: 18 }, // Modul 3
      { wch: 18 }, // Modul 4
      { wch: 18 }, // Modul 5
      { wch: 20 }, // Rata-rata
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai Siswa');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  // 13. Template & Pengirim Email Atur Ulang Kata Sandi
  private async sendPasswordResetEmailTemplate(
    email: string,
    nama: string,
    token: string,
    namaSekolah: string,
  ): Promise<string | undefined> {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;

    const hasBrevo = !!brevoApiKey && !!brevoSenderEmail;
    const hasGmail = gmailUser && gmailPass && !gmailUser.includes('placeholder') && !gmailPass.includes('placeholder');

    if (!hasBrevo && !hasGmail) {
      return 'Konfigurasi email (Brevo API Key atau Gmail SMTP) belum diatur di server.';
    }

    const cpNameSettings = await this.prisma.settings.findUnique({ where: { key: 'cp_name' } });
    const cpWaSettings = await this.prisma.settings.findUnique({ where: { key: 'cp_whatsapp' } });

    const cpName = cpNameSettings?.value || 'Admin N-KGTS';
    let rawCpWa = cpWaSettings?.value || '6281234567890';
    let cpWa = rawCpWa.replace(/\D/g, '');
    if (cpWa.startsWith('0')) {
      cpWa = '62' + cpWa.slice(1);
    }
    if (!cpWa) cpWa = '6281234567890';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailHtmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d8abc; margin: 0;">N-KGTS LMS Platform</h2>
          <p style="color: #777; margin: 5px 0 0 0;">Pembelajaran Budaya Kaizen & 5R</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
        <p>Halo, <strong>${nama}</strong>!</p>
        <p>Admin platform LMS N-KGTS (${namaSekolah}) telah mengirimkan instruksi untuk mengatur ulang kata sandi akun Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat kata sandi baru Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0d8abc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Atur Ulang Kata Sandi</a>
        </div>
        <p style="color: #555; font-size: 13px;">Tautan ini berlaku selama <strong>24 jam</strong>. Jika Anda tidak merasa meminta atur ulang kata sandi, silakan abaikan email ini atau hubungi Admin Sekolah Anda.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px; margin-bottom: 15px;" />
        <div style="font-size: 12px; color: #777;">
          <p>Butuh bantuan? Hubungi Contact Person kami:</p>
          <p>Nama: <strong>${cpName}</strong><br />WhatsApp: <a href="https://wa.me/${cpWa}" style="color: #0d8abc; text-decoration: none;">+${cpWa}</a></p>
        </div>
      </div>
    `;

    // 1. Coba Brevo API Terlebih Dahulu
    if (hasBrevo) {
      const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Kaizenesia';
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
            subject: 'Instruksi Atur Ulang Kata Sandi - Kaizenesia',
            htmlContent: mailHtmlContent,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          console.log('Email reset password berhasil dikirim via Brevo API ke:', email);
          return undefined;
        } else {
          const errData = await response.json();
          const errMsg = errData.message || 'Error API Brevo';
          console.error('Gagal mengirim email reset via Brevo API:', errData);
          if (!hasGmail) return `Brevo API: ${errMsg}`;
        }
      } catch (err: any) {
        console.error('Error saat menghubungi API Brevo:', err);
        if (!hasGmail) return `Brevo API: ${err.message || 'Koneksi timeout'}`;
      }
    }

    // 2. Fallback Gmail SMTP
    if (hasGmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
          tls: {
            rejectUnauthorized: false
          }
        });

        await transporter.sendMail({
          from: `"Kaizenesia" <${gmailUser}>`,
          to: email,
          subject: 'Instruksi Atur Ulang Kata Sandi - Kaizenesia',
          html: mailHtmlContent,
        });

        console.log('Email reset password berhasil dikirim via Gmail SMTP fallback ke:', email);
        return undefined;
      } catch (err: any) {
        console.error('Gagal mengirim email reset via Gmail SMTP fallback:', err);
        return `Gmail SMTP: ${err.message || 'Gagal mengirim email'}`;
      }
    }

    return 'Gagal memproses pengiriman email.';
  }

  // 14. Kirim Email Reset Password Terpandu Admin (Token 24 Jam)
  async sendResetPasswordEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sekolah: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    // Generate token acak (32 bytes hex)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24 jam

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        reset_password_token: token,
        reset_password_expires: expiresAt,
      },
    });

    const emailError = await this.sendPasswordResetEmailTemplate(
      user.email,
      user.nama,
      token,
      user.sekolah?.nama_sekolah || 'N-KGTS',
    );

    if (emailError) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return {
        message: `Token reset password berhasil dibuat, namun email gagal dikirim otomatis (${emailError}). Anda dapat membagikan tautan reset secara manual.`,
        resetLink: `${frontendUrl}/reset-password?token=${token}`,
      };
    }

    return {
      message: `Email instruksi atur ulang kata sandi berhasil dikirim ke ${user.email} (berlaku 24 jam)!`,
    };
  }

  // 15. Ambil Daftar Pengguna dengan Token Reset Password Aktif (Admin Only)
  async getActiveResetPasswordUsers() {
    const now = new Date();
    const users = await this.prisma.user.findMany({
      where: {
        reset_password_token: { not: null },
        reset_password_expires: { gt: now },
      },
      orderBy: { reset_password_expires: 'desc' },
      include: { sekolah: true },
    });

    return users.map((user) => ({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      nis: user.nis,
      kelas: user.kelas,
      nama_sekolah: user.sekolah?.nama_sekolah || 'N-KGTS Pusat',
      created_at: user.created_at,
      reset_password_expires: user.reset_password_expires,
      token: user.reset_password_token,
    }));
  }

  // 16. Batalkan Tautan Reset Password Pengguna (Admin Only)
  async cancelResetPasswordToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        reset_password_token: null,
        reset_password_expires: null,
      },
    });

    return {
      message: `Tautan atur ulang kata sandi untuk akun ${user.nama} (${user.email}) berhasil dibatalkan.`,
    };
  }

  // 17. Generate official Excel template buffer for user import (.xlsx)
  generateTemplateExcel(): Buffer {
    const templateData = [
      {
        'Email Aktif': 'siswa.contoh@nkgts.sch.id',
        'Nama Lengkap': 'Budi Utomo',
        'Role': 'siswa',
        'Asal Sekolah': 'SMK Negeri 26 Jakarta',
        'NIS': '12345678',
        'Kelas Saat Mendaftar': 'Kelas 11',
        'Nama SGA / Jurusan': 'Teknik Kendaraan Ringan',
        'No HP / WhatsApp': '081234567890',
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir': '2007-05-15',
        'Tahun Angkatan': 2027
      },
      {
        'Email Aktif': 'guru.contoh@nkgts.sch.id',
        'Nama Lengkap': 'Siti Aminah',
        'Role': 'guru',
        'Asal Sekolah': 'SMK Negeri 26 Jakarta',
        'NIS': '',
        'Kelas Saat Mendaftar': '',
        'Nama SGA / Jurusan': 'Otomotif',
        'No HP / WhatsApp': '081987654321',
        'Tempat Lahir': 'Bandung',
        'Tanggal Lahir': '1985-08-20',
        'Tahun Angkatan': ''
      },
      {
        'Email Aktif': 'admin.contoh@nkgts.sch.id',
        'Nama Lengkap': 'Ahmad Fauzi',
        'Role': 'admin',
        'Asal Sekolah': 'N-KGTS Pusat',
        'NIS': '',
        'Kelas Saat Mendaftar': '',
        'Nama SGA / Jurusan': 'Admin Sistem',
        'No HP / WhatsApp': '085678901234',
        'Tempat Lahir': 'Surabaya',
        'Tanggal Lahir': '1990-01-10',
        'Tahun Angkatan': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Undangan');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // 18. Batch Delete Pengguna Aktif (Admin Only)
  async bulkDeleteUsers(ids: (string | number)[], currentUserId?: string) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Daftar ID yang dipilih tidak boleh kosong.');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Normalisasi dan validasi: pastikan string UUID valid dan buang jika sama dengan currentUserId
    const cleanIds = ids
      .map((id) => String(id).trim())
      .filter((id) => uuidRegex.test(id) && (!currentUserId || id !== currentUserId));

    if (cleanIds.length === 0) {
      if (ids.some((id) => String(id).trim() === currentUserId)) {
        return {
          success: 0,
          message: 'Akun admin yang sedang aktif login dilindungi dan tidak dapat dihapus.',
        };
      }
      throw new BadRequestException('Tidak ada ID pengguna valid yang dapat diproses.');
    }

    // Eksekusi penghapusan HANYA untuk cleanIds yang secara eksplisit dicentang/dikirim
    // DILINDUNGI: akun admin utama (admin@nkgts.com) dan seluruh akun dengan role admin
    const res = await this.prisma.user.deleteMany({
      where: {
        id: { in: cleanIds },
        email: { not: 'admin@nkgts.com' },
        role: { not: RoleEnum.admin },
      },
    });

    if (res.count === 0) {
      return {
        success: 0,
        message: 'Tidak ada akun pengguna yang dihapus (akun dengan role admin dilindungi dari penghapusan massal).',
      };
    }

    return {
      success: res.count,
      message: `Berhasil menghapus ${res.count} akun pengguna secara massal.`,
    };
  }

  // 19. Batch Kirim Link Reset Password Pengguna Aktif (Admin Only)
  async bulkSendResetPassword(ids: (string | number)[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Daftar ID yang dipilih tidak boleh kosong.');
    }

    const validIds = ids
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== 'undefined' && id !== 'null');

    if (validIds.length === 0) {
      throw new BadRequestException('Tidak ada ID valid yang ditemukan untuk diproses.');
    }

    let successCount = 0;
    let failCount = 0;

    // Proses dalam kelompok (batch 5) agar tidak membebani transport email
    for (let i = 0; i < validIds.length; i += 5) {
      const chunk = validIds.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (id) => {
          try {
            await this.sendResetPasswordEmail(id);
            successCount++;
          } catch (e) {
            failCount++;
          }
        }),
      );
    }

    return {
      success: successCount,
      failed: failCount,
      message: `Selesai mengirim link reset kata sandi ke ${successCount} pengguna (${failCount} gagal).`,
    };
  }

  // 20. Batch Hapus Undangan Tertunda (Admin Only)
  async bulkDeleteInvitations(ids: (string | number)[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Daftar ID yang dipilih tidak boleh kosong.');
    }

    const numericIds = ids
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (numericIds.length === 0) {
      throw new BadRequestException('Tidak ada ID valid yang ditemukan untuk diproses.');
    }

    const res = await this.prisma.invitationToken.deleteMany({
      where: {
        id: { in: numericIds },
        is_used: false,
      },
    });

    return {
      success: res.count,
      message: `Berhasil membatalkan dan menghapus ${res.count} undangan tertunda.`,
    };
  }

  // 21. Batch Kirim Ulang Email Undangan (Admin Only)
  async bulkResendInvitations(ids: (string | number)[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Daftar ID yang dipilih tidak boleh kosong.');
    }

    const numericIds = ids
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (numericIds.length === 0) {
      throw new BadRequestException('Tidak ada ID valid yang ditemukan untuk diproses.');
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < numericIds.length; i += 5) {
      const chunk = numericIds.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (id) => {
          try {
            await this.resendInvitation(id);
            successCount++;
          } catch (e) {
            failCount++;
          }
        }),
      );
    }

    return {
      success: successCount,
      failed: failCount,
      message: `Berhasil mengirim ulang ${successCount} email undangan (${failCount} gagal).`,
    };
  }

  // 22. Batch Batalkan Token Reset Password Aktif (Admin Only)
  async bulkCancelResetPassword(ids: (string | number)[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Daftar ID yang dipilih tidak boleh kosong.');
    }

    const validIds = ids
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== 'undefined' && id !== 'null');

    if (validIds.length === 0) {
      throw new BadRequestException('Tidak ada ID valid yang ditemukan untuk diproses.');
    }

    const res = await this.prisma.user.updateMany({
      where: { id: { in: validIds } },
      data: {
        reset_password_token: null,
        reset_password_expires: null,
      },
    });

    return {
      success: res.count,
      message: `Berhasil membatalkan ${res.count} tautan reset sandi aktif.`,
    };
  }
}


