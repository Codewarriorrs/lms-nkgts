import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLatsolDto } from './dto/create-latsol.dto';
import { SubmitLatsolDto } from './dto/submit-latsol.dto';

@Injectable()
export class LatsolService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tambah soal latihan (Guru)
  async createQuestion(dto: CreateLatsolDto) {
    // Validasi index jawaban benar
    if (dto.jawaban_benar < 0 || dto.jawaban_benar >= dto.pilihan.length) {
      throw new BadRequestException('Kunci jawaban berada di luar rentang pilihan jawaban');
    }

    return this.prisma.latihanSoal.create({
      data: {
        modul_teori_id: dto.modul_teori_id,
        pertanyaan: dto.pertanyaan,
        pilihan: dto.pilihan, // Array otomatis dipetakan ke JSON di prisma
        jawaban_benar: dto.jawaban_benar,
        poin: dto.poin,
        image_url: dto.image_url || null,
      },
    });
  }

  // 2. Hapus soal latihan (Guru)
  async deleteQuestion(id: number) {
    const question = await this.prisma.latihanSoal.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException('Soal tidak ditemukan');
    }

    await this.prisma.latihanSoal.delete({
      where: { id },
    });

    return { message: 'Soal berhasil dihapus' };
  }

  // 3. Ambil soal kuis Latsol untuk modul tertentu
  async getQuestionsForModule(moduleId: number, isGuru: boolean, userId?: string) {
    // Jika siswa, pastikan latsol untuk modul ini sudah terbuka (unlocked)
    if (!isGuru && userId) {
      const statusList = await this.getLatsolStatusForStudent(userId);
      const target = statusList.find((s) => s.modul_id === moduleId);
      if (!target || !target.unlocked) {
        throw new BadRequestException('Latihan Soal untuk modul ini masih terkunci.');
      }
    }

    const questions = await this.prisma.latihanSoal.findMany({
      where: { modul_teori_id: moduleId },
      orderBy: { id: 'asc' },
    });

    // Jika siswa, hilangkan field kunci 'jawaban_benar' agar tidak bisa dicheat di inspect element
    if (!isGuru) {
      return questions.map((q) => {
        const { jawaban_benar, ...rest } = q;
        return rest;
      });
    }

    return questions;
  }

  // 4. Hitung & simpan hasil submisi Latsol siswa
  async submitStudentLatsol(userId: string, dto: SubmitLatsolDto) {
    const { modul_teori_id, jawaban } = dto;

    // Pastikan latsol untuk modul ini terbuka untuk siswa
    const statusList = await this.getLatsolStatusForStudent(userId);
    const target = statusList.find((s) => s.modul_id === modul_teori_id);
    if (!target || !target.unlocked) {
      throw new BadRequestException('Latihan Soal untuk modul ini masih terkunci.');
    }

    // Ambil semua soal untuk modul ini
    const dbQuestions = await this.prisma.latihanSoal.findMany({
      where: { modul_teori_id },
    });

    if (dbQuestions.length === 0) {
      throw new BadRequestException('Modul ini belum memiliki soal latihan.');
    }

    let totalPoinDiperoleh = 0;
    let totalPoinMaksimum = 0;
    let totalBenar = 0;

    for (const q of dbQuestions) {
      totalPoinMaksimum += q.poin;
      const siswaAns = jawaban.find((j) => j.soal_id === q.id);
      if (siswaAns && siswaAns.jawaban_siswa === q.jawaban_benar) {
        totalPoinDiperoleh += q.poin;
        totalBenar++;
      }
    }

    // Hitung persentase skor akhir (0-100)
    const skorPersen = Math.round((totalPoinDiperoleh / totalPoinMaksimum) * 100);

    // Simpan atau update rekap nilai
    const result = await this.prisma.nilaiLatsol.upsert({
      where: {
        siswa_id_modul_teori_id: {
          siswa_id: userId,
          modul_teori_id,
        },
      },
      create: {
        siswa_id: userId,
        modul_teori_id,
        skor: skorPersen,
        total_poin: totalPoinDiperoleh,
      },
      update: {
        skor: skorPersen,
        total_poin: totalPoinDiperoleh,
      },
    });

    return {
      ...result,
      total_benar: totalBenar,
      total_soal: dbQuestions.length,
      poin_diperoleh: totalPoinDiperoleh,
      poin_maksimum: totalPoinMaksimum,
    };
  }

  // 5. Cek status prasyarat & aksesibilitas Latsol per-modul siswa
  async getLatsolStatusForStudent(userId: string) {
    // Ambil semua modul terurut berdasarkan urutan
    const modules = await this.prisma.modulTeori.findMany({
      orderBy: { urutan: 'asc' },
    });

    const statusList: Array<{
      modul_id: number;
      judul: string;
      urutan: number;
      slug: string;
      unlocked: boolean;
      alasan_terkunci?: string;
      completed: boolean;
      nilai?: number;
      poin?: number;
    }> = [];

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];

      // A. Ambil progress bacaan modul oleh siswa
      const progress = await this.prisma.progresTeori.findUnique({
        where: {
          siswa_id_modul_teori_id: {
            siswa_id: userId,
            modul_teori_id: mod.id,
          },
        },
      });

      // B. Ambil nilai kuis internal modul
      const internalQuiz = await this.prisma.nilaiLatihan.findFirst({
        where: {
          siswa_id: userId,
          modul_teori_id: mod.id,
        },
        orderBy: { skor: 'desc' }, // Ambil nilai kuis tertinggi
      });

      // C. Ambil status Latsol modul ini sendiri (jika sudah dikerjakan)
      const existingLatsolVal = await this.prisma.nilaiLatsol.findUnique({
        where: {
          siswa_id_modul_teori_id: {
            siswa_id: userId,
            modul_teori_id: mod.id,
          },
        },
      });

      // Cek prasyarat:
      let unlocked = true;
      let alasan_terkunci = '';

      // Prasyarat 1: Modul materi harus selesai dibaca
      if (!progress || progress.status !== 'selesai') {
        unlocked = false;
        alasan_terkunci = `Materi modul "${mod.judul}" belum selesai dibaca.`;
      }
      // Prasyarat 2: Kuis di dalam materi harus bernilai 100 (benar semua)
      else if (!internalQuiz || internalQuiz.skor !== 100) {
        unlocked = false;
        alasan_terkunci = `Kuis materi di akhir modul "${mod.judul}" belum diselesaikan dengan nilai 100%.`;
      }
      // Prasyarat 3: Modul sebelumnya harus sudah menyelesaikan Latsol-nya (berurutan)
      else if (i > 0) {
        const prevStatus = statusList[i - 1];
        if (!prevStatus.completed) {
          unlocked = false;
          alasan_terkunci = `Anda harus menyelesaikan Latihan Soal untuk modul "${prevStatus.judul}" terlebih dahulu.`;
        }
      }

      statusList.push({
        modul_id: mod.id,
        judul: mod.judul,
        urutan: mod.urutan,
        slug: mod.slug,
        unlocked,
        alasan_terkunci: unlocked ? undefined : alasan_terkunci,
        completed: !!existingLatsolVal,
        nilai: existingLatsolVal?.skor,
        poin: existingLatsolVal?.total_poin,
      });
    }

    return statusList;
  }
}
