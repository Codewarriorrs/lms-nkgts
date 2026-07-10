import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { ReviewProjectDto } from './dto/review-project.dto';

@Injectable()
export class ProjectKaizenService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Ambil status pengumpulan project (proposal dan laporan) untuk siswa tertentu
  async getSiswaProjects(siswaId: string) {
    return this.prisma.fileProject.findMany({
      where: { siswa_id: siswaId },
      orderBy: { submitted_at: 'asc' },
    });
  }

  // 2. Kirim/unggah berkas project (proposal atau laporan) dari siswa
  async submitProject(siswaId: string, dto: SubmitProjectDto) {
    const existing = await this.prisma.fileProject.findFirst({
      where: {
        siswa_id: siswaId,
        tipe: dto.tipe,
      },
    });

    if (existing) {
      return this.prisma.fileProject.update({
        where: { id: existing.id },
        data: {
          file_url: dto.file_url,
          file_name: dto.file_name,
          catatan_siswa: dto.catatan_siswa,
        },
      });
    }

    return this.prisma.fileProject.create({
      data: {
        siswa_id: siswaId,
        tipe: dto.tipe,
        file_url: dto.file_url,
        file_name: dto.file_name,
        catatan_siswa: dto.catatan_siswa,
      },
    });
  }

  // 3. Ambil seluruh data project siswa dari sekolah yang sama dengan guru
  async getAllProjects(guruId: string) {
    const guru = await this.prisma.user.findUnique({
      where: { id: guruId },
      select: { sekolah_id: true },
    });

    if (!guru || !guru.sekolah_id) {
      return [];
    }

    return this.prisma.fileProject.findMany({
      where: {
        siswa: {
          sekolah_id: guru.sekolah_id,
        },
      },
      include: {
        siswa: {
          select: {
            id: true,
            nama: true,
            email: true,
            kelas: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });
  }

  // 4. Proses penilaian dan unggah balik file revisi dari guru
  async reviewProject(projectId: string, dto: ReviewProjectDto) {
    const project = await this.prisma.fileProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Berkas proyek Kaizen tidak ditemukan!');
    }

    return this.prisma.fileProject.update({
      where: { id: projectId },
      data: {
        nilai: dto.nilai !== undefined ? dto.nilai : project.nilai,
        catatan_guru: dto.catatan_guru !== undefined ? dto.catatan_guru : project.catatan_guru,
        file_revisi_url: dto.file_revisi_url !== undefined ? dto.file_revisi_url : project.file_revisi_url,
        file_revisi_name: dto.file_revisi_name !== undefined ? dto.file_revisi_name : project.file_revisi_name,
      },
    });
  }
}
