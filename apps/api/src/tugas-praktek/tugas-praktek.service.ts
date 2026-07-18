import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTugasPraktekDto } from './dto/create-tugas-praktek.dto';

@Injectable()
export class TugasPraktekService {
  constructor(private prisma: PrismaService) {}

  // 1. Fungsi untuk melihat status semua tugas milik siswa yang sedang login
  async getSiswaSubmisi(siswaId: string) {
    // Ambil master data 5 topik tugas beserta data submisi siswa jika ada
    return this.prisma.tugasPraktek.findMany({
      orderBy: { urutan: 'asc' },
      include: {
        submisi: {
          where: { siswa_id: siswaId },
        },
      },
    });
  }

  // 2. Fungsi untuk memproses pengumpulan tugas digital siswa
  async submitTugas(siswaId: string, tugasPraktekId: number, dto: CreateTugasPraktekDto) {
    // A. Validasi eksistensi tugas
    const currentTask = await this.prisma.tugasPraktek.findUnique({
      where: { id: tugasPraktekId },
    });

    if (!currentTask) {
      throw new NotFoundException('Tugas praktikum tidak ditemukan!');
    }

    // B. Validasi Aturan Urutan: Cari tugas sebelumnya berdasarkan urutan terkecil terdekat
    const prevTask = await this.prisma.tugasPraktek.findFirst({
      where: {
        urutan: { lt: currentTask.urutan },
      },
      orderBy: { urutan: 'desc' },
    });

    if (prevTask) {
      const sudahSubmitSebelumnya = await this.prisma.submisiPraktek.findUnique({
        where: {
          siswa_id_tugas_praktek_id: {
            siswa_id: siswaId,
            tugas_praktek_id: prevTask.id,
          },
        },
      });

      if (!sudahSubmitSebelumnya) {
        throw new BadRequestException(`Kamu harus menyelesaikan tugas "${prevTask.judul}" terlebih dahulu!`);
      }
    }

    // C. Ambil data submisi lama untuk proses merge detail_jawaban
    const existing = await this.prisma.submisiPraktek.findUnique({
      where: {
        siswa_id_tugas_praktek_id: {
          siswa_id: siswaId,
          tugas_praktek_id: tugasPraktekId,
        },
      },
    });

    const existingDetail = existing?.detail_jawaban && typeof existing.detail_jawaban === 'object'
      ? (existing.detail_jawaban as Record<string, any>)
      : {};
    const mergedDetail = {
      ...existingDetail,
      ...(dto.detail_jawaban && typeof dto.detail_jawaban === 'object' ? dto.detail_jawaban : {})
    };

    // D. Eksekusi penyimpanan menggunakan teknik UPSERT (Update jika ada, Insert jika baru)
    return this.prisma.submisiPraktek.upsert({
      where: {
        siswa_id_tugas_praktek_id: {
          siswa_id: siswaId,
          tugas_praktek_id: tugasPraktekId,
        },
      },
      update: {
        tanggal: dto.tanggal ?? existing?.tanggal ?? new Date().toISOString().slice(0, 10),
        area_pengisian: dto.area_pengisian ?? existing?.area_pengisian ?? "",
        keterangan: dto.keterangan ?? existing?.keterangan ?? "",
        detail_jawaban: mergedDetail,
      },
      create: {
        siswa_id: siswaId,
        tugas_praktek_id: tugasPraktekId,
        tanggal: dto.tanggal ?? new Date().toISOString().slice(0, 10),
        area_pengisian: dto.area_pengisian ?? "",
        keterangan: dto.keterangan ?? "",
        detail_jawaban: mergedDetail,
      },
    });
  }

  // 3. Ambil semua tugas siswa dari sekolah guru yang sama
  async getAllSubmisi(guruId: string) {
    const requestor = await this.prisma.user.findUnique({
      where: { id: guruId },
      select: { sekolah_id: true, role: true },
    });

    if (!requestor) {
      return [];
    }

    const whereClause: any = {};
    if (requestor.role !== 'admin') {
      if (!requestor.sekolah_id) {
        return [];
      }
      whereClause.siswa = {
        sekolah_id: requestor.sekolah_id,
      };
    }

    return this.prisma.submisiPraktek.findMany({
      where: whereClause,
      include: {
        siswa: {
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
          },
        },
        tugas_praktek: true,
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });
  }

  // 4. Beri nilai dan catatan/feedback pada submisi
  async gradeSubmisi(submisiId: string, nilai: number, catatanGuru?: string) {
    const submisi = await this.prisma.submisiPraktek.findUnique({
      where: { id: submisiId },
    });

    if (!submisi) {
      throw new NotFoundException('Submisi tugas tidak ditemukan!');
    }

    return this.prisma.submisiPraktek.update({
      where: { id: submisiId },
      data: {
        nilai,
        catatan_guru: catatanGuru !== undefined ? catatanGuru : submisi.catatan_guru,
      },
    });
  }
}