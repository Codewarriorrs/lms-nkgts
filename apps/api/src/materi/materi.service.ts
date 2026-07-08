import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ProgresEnum } from '../../generated/prisma';

@Injectable()
export class MateriService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string) {
    // 1. Ambil data progres membaca
    const progressRecords = await this.prisma.progresTeori.findMany({
      where: { siswa_id: userId },
    });

    // 2. Ambil data nilai kuis tertinggi per modul
    const quizRecords = await this.prisma.nilaiLatihan.findMany({
      where: { siswa_id: userId },
    });

    // Petakan nilai kuis tertinggi per modul
    const quizMap: Record<number, number> = {};
    for (const record of quizRecords) {
      const existingScore = quizMap[record.modul_teori_id] ?? 0;
      quizMap[record.modul_teori_id] = Math.max(existingScore, record.skor);
    }

    // 3. Susun data hasil gabungan untuk frontend
    const result: Record<string, { completed: boolean; scrollProgress: number; score: number | null }> = {};

    // Inisialisasi default untuk modul yang sudah terdaftar di DB
    const allModules = await this.prisma.modulTeori.findMany({
      select: { id: true }
    });

    for (const m of allModules) {
      result[m.id.toString()] = {
        completed: false,
        scrollProgress: 0,
        score: null,
      };
    }

    // Isi dengan data progres riil dari DB
    for (const record of progressRecords) {
      const bestScore = quizMap[record.modul_teori_id] ?? null;
      const isCompleted = record.status === ProgresEnum.selesai || (bestScore !== null && bestScore >= 70);

      result[record.modul_teori_id.toString()] = {
        completed: isCompleted,
        scrollProgress: record.persentase,
        score: bestScore,
      };
    }

    // Lengkapi data modul yang kuisnya sudah dikerjakan tapi progres bacanya belum ada catatan di DB
    for (const [modulIdStr, bestScore] of Object.entries(quizMap)) {
      if (result[modulIdStr] && result[modulIdStr].score === null) {
        result[modulIdStr].score = bestScore;
        if (bestScore >= 70) {
          result[modulIdStr].completed = true;
        }
      }
    }

    return result;
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const { modul_teori_id, scroll_progress, status } = dto;

    // Pastikan modul ada
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id: modul_teori_id },
    });
    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }

    // Ambil data progres lama
    const existing = await this.prisma.progresTeori.findUnique({
      where: {
        siswa_id_modul_teori_id: {
          siswa_id: userId,
          modul_teori_id,
        },
      },
    });

    // Tentukan persentase baru (hanya boleh bertambah/maju)
    const nextProgress = existing ? Math.max(existing.persentase, scroll_progress) : scroll_progress;

    // Tentukan status progres baru
    let nextStatus: ProgresEnum = ProgresEnum.belum_dimulai;
    if (existing?.status === ProgresEnum.selesai || nextProgress >= 100 || status === 'selesai') {
      nextStatus = ProgresEnum.selesai;
    } else if (nextProgress > 0 || status === 'sedang_dibaca') {
      nextStatus = ProgresEnum.sedang_dibaca;
    }

    // Update atau Create data progres secara transaksional
    return this.prisma.progresTeori.upsert({
      where: {
        siswa_id_modul_teori_id: {
          siswa_id: userId,
          modul_teori_id,
        },
      },
      update: {
        persentase: nextProgress,
        status: nextStatus,
      },
      create: {
        siswa_id: userId,
        modul_teori_id,
        persentase: nextProgress,
        status: nextStatus,
      },
    });
  }

  async submitQuiz(userId: string, dto: SubmitQuizDto) {
    const { modul_teori_id, score } = dto;

    // Pastikan modul ada
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id: modul_teori_id },
    });
    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }

    // 1. Simpan skor ke tabel NilaiLatihan
    const attempt = await this.prisma.nilaiLatihan.create({
      data: {
        siswa_id: userId,
        modul_teori_id,
        skor: score,
      },
    });

    // 2. Jika skor >= 70, paksa status progres modul tersebut menjadi 'selesai'
    if (score >= 70) {
      await this.prisma.progresTeori.upsert({
        where: {
          siswa_id_modul_teori_id: {
            siswa_id: userId,
            modul_teori_id,
          },
        },
        update: {
          status: ProgresEnum.selesai,
        },
        create: {
          siswa_id: userId,
          modul_teori_id,
          status: ProgresEnum.selesai,
          persentase: 100,
        },
      });
    }

    return attempt;
  }

  async getModuleDetails(slug: string) {
    const modul = await this.prisma.modulTeori.findUnique({
      where: { slug },
      include: {
        soal_latihan: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }

    return modul;
  }

  async updateModuleContent(id: number, content: string) {
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id },
    });

    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }

    return this.prisma.modulTeori.update({
      where: { id },
      data: {
        deskripsi: content,
      },
    });
  }
}
