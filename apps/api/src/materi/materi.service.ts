import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ProgresEnum } from '../../generated/prisma';
import { UpdateMateriDto } from './dto/update-materi.dto';

@Injectable()
export class MateriService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string) {
    // 1. Ambil data progres membaca
    const progressRecords = await this.prisma.progresTeori.findMany({
      where: { siswa_id: userId },
      include: { modul_teori: true },
    });

    // 2. Ambil data nilai kuis tertinggi per modul
    const quizRecords = await this.prisma.nilaiLatihan.findMany({
      where: { siswa_id: userId },
      include: { modul_teori: true },
    });

    // Petakan nilai kuis tertinggi per modul
    const quizMap: Record<number, number> = {};
    for (const record of quizRecords) {
      const existingScore = quizMap[record.modul_teori_id] ?? 0;
      quizMap[record.modul_teori_id] = Math.max(existingScore, record.skor);
    }

    // 3. Susun data hasil gabungan untuk frontend
    const result: Record<string, { completed: boolean; scrollProgress: number; score: number | null }> = {};

    // Inisialisasi default untuk modul yang sudah terdaftar di DB (mapping ID & urutan)
    const allModules = await this.prisma.modulTeori.findMany({
      select: { id: true, urutan: true, slug: true }
    });

    for (const m of allModules) {
      const defaultVal = { completed: false, scrollProgress: 0, score: null };
      result[m.id.toString()] = defaultVal;
      result[m.urutan.toString()] = defaultVal;
      result[m.slug] = defaultVal;
    }

    // Isi dengan data progres riil dari DB
    for (const record of progressRecords) {
      const bestScore = quizMap[record.modul_teori_id] ?? null;
      const isCompleted = record.status === ProgresEnum.selesai || (bestScore !== null && bestScore >= 70) || record.persentase >= 92;

      const stateVal = {
        completed: isCompleted,
        scrollProgress: isCompleted ? 100 : record.persentase,
        score: bestScore,
      };

      result[record.modul_teori_id.toString()] = stateVal;
      if (record.modul_teori) {
        result[record.modul_teori.urutan.toString()] = stateVal;
        result[record.modul_teori.slug] = stateVal;
      }
    }

    // Lengkapi data modul yang kuisnya sudah dikerjakan tapi progres bacanya belum ada catatan di DB
    for (const record of quizRecords) {
      const bestScore = quizMap[record.modul_teori_id] ?? null;
      if (bestScore !== null) {
        const modulIdStr = record.modul_teori_id.toString();
        const urutanStr = record.modul_teori?.urutan.toString();
        const isCompleted = bestScore >= 70;

        if (result[modulIdStr]) {
          result[modulIdStr].score = bestScore;
          if (isCompleted) result[modulIdStr].completed = true;
        }
        if (urutanStr && result[urutanStr]) {
          result[urutanStr].score = bestScore;
          if (isCompleted) result[urutanStr].completed = true;
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

  // 4b. Ambil semua modul terdaftar di database beserta soal latihannya
  async getAllModules() {
    return this.prisma.modulTeori.findMany({
      include: {
        soal_latihan: {
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { urutan: 'asc' },
    });
  }

  // 5. Mengambil progres belajar rinci setiap siswa per-modul
  async getStudentsProgress(guruId: string) {
    const requestor = await this.prisma.user.findUnique({
      where: { id: guruId },
      select: { sekolah_id: true, role: true },
    });

    if (!requestor) {
      return [];
    }

    const whereClause: any = { role: 'siswa' };
    if (requestor.role !== 'admin') {
      if (!requestor.sekolah_id) {
        return [];
      }
      whereClause.sekolah_id = requestor.sekolah_id;
    }

    const students = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        email: true,
        kelas: true,
        sekolah_id: true,
        sekolah: {
          select: {
            nama_sekolah: true,
          },
        },
        progres_teori: {
          include: { modul_teori: true },
        },
        nilai_latihan: true,
        nilai_latsol: true,
      },
      orderBy: {
        nama: 'asc',
      },
    });

    const allModules = await this.prisma.modulTeori.findMany({
      orderBy: { urutan: 'asc' },
    });

    return students.map((student) => {
      // Petakan skor latihan kuis tertinggi per modul
      const quizMap: Record<number, number> = {};
      for (const record of student.nilai_latihan) {
        const existingScore = quizMap[record.modul_teori_id] ?? 0;
        quizMap[record.modul_teori_id] = Math.max(existingScore, record.skor);
      }

      // Petakan skor Latsol per modul
      const latsolMap: Record<number, { skor: number; total_poin: number }> = {};
      for (const record of student.nilai_latsol) {
        latsolMap[record.modul_teori_id] = {
          skor: record.skor,
          total_poin: record.total_poin
        };
      }

      const modulesProgress = allModules.map((mod) => {
        const prog = student.progres_teori.find((p) => p.modul_teori_id === mod.id);
        const score = quizMap[mod.id] ?? null;
        const latsolInfo = latsolMap[mod.id] ?? null;
        return {
          id: mod.id,
          judul: mod.judul,
          persentase: prog ? prog.persentase : 0,
          completed: prog ? (prog.status === ProgresEnum.selesai || (score !== null && score >= 70)) : false,
          score,
          latsol_score: latsolInfo ? latsolInfo.skor : null,
          latsol_poin: latsolInfo ? latsolInfo.total_poin : null,
        };
      });

      return {
        id: student.id,
        nama: student.nama,
        email: student.email,
        kelas: student.kelas,
        sekolah_id: student.sekolah_id,
        sekolah_nama: student.sekolah?.nama_sekolah || "N-KGTS Pusat",
        modules: modulesProgress,
      };
    });
  }

  // 6. Membuat modul materi baru
  async createModule(judul: string, deskripsi: string, slug: string, urutan: number) {
    // Cari topik pertama atau buat jika kosong
    let topik = await this.prisma.topikPelatihan.findFirst();
    if (!topik) {
      topik = await this.prisma.topikPelatihan.create({
        data: { nama_topik: 'Budaya Kaizen', deskripsi: 'Materi Pelatihan Kaizen' },
      });
    }

    return this.prisma.modulTeori.create({
      data: {
        topik_id: topik.id,
        judul,
        deskripsi,
        slug,
        urutan,
      },
    });
  }

  // 7. Mengedit modul materi
  async editModule(id: number, judul: string, deskripsi: string, slug: string, urutan: number) {
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id },
    });
    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }

    return this.prisma.modulTeori.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        slug,
        urutan,
      },
    });
  }

  // 8. Menghapus modul materi
  async deleteModule(id: number) {
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id },
    });
    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }
    return this.prisma.modulTeori.delete({
      where: { id },
    });
  }

  // 9. Membuat soal latihan kuis untuk modul tertentu
  async createSoal(
    modulTeoriId: number,
    pertanyaan: string,
    pilihanA: string,
    pilihanB: string,
    pilihanC: string,
    pilihanD: string,
    jawabanBenar: number
  ) {
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id: modulTeoriId },
    });
    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }

    return this.prisma.soalLatihan.create({
      data: {
        modul_teori_id: modulTeoriId,
        pertanyaan,
        pilihan_a: pilihanA,
        pilihan_b: pilihanB,
        pilihan_c: pilihanC,
        pilihan_d: pilihanD,
        jawaban_benar: jawabanBenar,
      },
    });
  }

  // 10. Menghapus soal latihan kuis
  async deleteSoal(id: number) {
    const soal = await this.prisma.soalLatihan.findUnique({
      where: { id },
    });
    if (!soal) {
      throw new NotFoundException('Soal latihan tidak ditemukan');
    }
    return this.prisma.soalLatihan.delete({
      where: { id },
    });
  }

  // 11. Mengupdate materi (Admin/Guru)
  async update(id: string, updateMateriDto: UpdateMateriDto) {
    const { ringkasan, ...updateData } = updateMateriDto;
    const modul = await this.prisma.modulTeori.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!modul) {
      throw new NotFoundException('Modul teori tidak ditemukan');
    }
    return this.prisma.modulTeori.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });
  }
}
