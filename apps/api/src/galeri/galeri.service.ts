import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleEnum } from '../../generated/prisma';

@Injectable()
export class GaleriService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Membuat postingan galeri baru
  async createPost(userId: string, dto: { judul: string; deskripsi?: string; foto_url: string }) {
    // Cari data user untuk mengambil info sekolah
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sekolah: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return this.prisma.galeri.create({
      data: {
        user_id: userId,
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        foto_url: dto.foto_url,
        sekolah_id: user.sekolah_id,
        sekolah_nama: user.sekolah?.nama_sekolah || null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            foto_profil: true,
          },
        },
      },
    });
  }

  // 2. Mengambil semua postingan galeri
  async getAllPosts() {
    return this.prisma.galeri.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        uploader: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            foto_profil: true,
          },
        },
      },
    });
  }

  // 3. Mengambil postingan khusus untuk landing page
  // Aturan: Pilih minimal 1 dan maksimal 3 untuk setiap sekolah.
  // Jika postingan masih sedikit (< 15 secara keseluruhan), ambil semua gambar acak/terbaru (maksimal 15).
  async getLandingPosts() {
    const allPosts = await this.prisma.galeri.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        uploader: {
          select: {
            nama: true,
            foto_profil: true,
          },
        },
      },
    });

    if (allPosts.length <= 15) {
      return allPosts;
    }

    // Kelompokkan berdasarkan sekolah_id (atau sekolah_nama)
    const groupedBySchool: Record<string, typeof allPosts> = {};
    const postsWithoutSchool: typeof allPosts = [];

    for (const post of allPosts) {
      const key = post.sekolah_id ? String(post.sekolah_id) : null;
      if (key) {
        if (!groupedBySchool[key]) {
          groupedBySchool[key] = [];
        }
        groupedBySchool[key].push(post);
      } else {
        postsWithoutSchool.push(post);
      }
    }

    const selectedPosts: typeof allPosts = [];

    // Ambil maksimal 3 dari tiap sekolah
    for (const schoolId of Object.keys(groupedBySchool)) {
      const schoolPosts = groupedBySchool[schoolId];
      // Ambil hingga 3 postingan teratas
      const sliceCount = Math.min(schoolPosts.length, 3);
      selectedPosts.push(...schoolPosts.slice(0, sliceCount));
    }

    // Jika setelah didistribusikan per sekolah hasilnya masih sedikit, kita tambahkan postingan tanpa sekolah atau postingan lainnya
    if (selectedPosts.length < 15) {
      const remainingSlots = 15 - selectedPosts.length;
      const alreadySelectedIds = new Set(selectedPosts.map((p) => p.id));
      
      const extraPosts = allPosts.filter((p) => !alreadySelectedIds.has(p.id));
      selectedPosts.push(...extraPosts.slice(0, remainingSlots));
    }

    // Urutkan kembali berdasarkan waktu upload terbaru
    return selectedPosts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, 15);
  }

  // 4. Menghapus postingan galeri
  async deletePost(postId: string, userId: string, userRole: RoleEnum) {
    const post = await this.prisma.galeri.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Postingan galeri tidak ditemukan');
    }

    // Cari info uploader
    const postOwner = await this.prisma.user.findUnique({
      where: { id: post.user_id },
    });

    // Cari info requestor
    const requestor = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!requestor) {
      throw new ForbiddenException('Akses ditolak');
    }

    const isOwner = post.user_id === userId;
    const isAdmin = userRole === RoleEnum.admin;
    
    // Guru dari sekolah yang sama
    const isGuruSameSchool = 
      userRole === RoleEnum.guru && 
      postOwner && 
      requestor.sekolah_id !== null && 
      requestor.sekolah_id === postOwner.sekolah_id;

    if (!isOwner && !isAdmin && !isGuruSameSchool) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk menghapus postingan ini');
    }

    return this.prisma.galeri.delete({
      where: { id: postId },
    });
  }
}
