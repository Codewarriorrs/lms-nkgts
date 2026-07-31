import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleEnum, ApprovalStatus } from '../../generated/prisma';

@Injectable()
export class GaleriService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Membuat postingan galeri baru (Dengan Limitasi Kuota Upload Siswa & Status Moderasi)
  async createPost(userId: string, dto: { judul: string; deskripsi?: string; foto_url: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sekolah: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Pengecekan Kuota Upload: Siswa hanya dapat mengunggah 1 kali foto ke Galeri
    if (user.role === RoleEnum.siswa) {
      const uploadCount = await this.prisma.galeri.count({
        where: { user_id: userId },
      });

      if (uploadCount >= 1) {
        throw new ForbiddenException('Siswa hanya diperbolehkan mengunggah 1 kali foto ke Galeri N-KGTS.');
      }
    }

    // Admin postingan langsung APPROVED, selain itu default PENDING (butuh moderasi Admin)
    const initialStatus = user.role === RoleEnum.admin ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;

    return this.prisma.galeri.create({
      data: {
        user_id: userId,
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        foto_url: dto.foto_url,
        sekolah_id: user.sekolah_id,
        sekolah_nama: user.sekolah?.nama_sekolah || null,
        status: initialStatus,
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

  // 2. Mengambil postingan galeri dengan Paginasi & Filter Status (Default: APPROVED)
  async getAllPosts(pageStr?: string, limitStr?: string, statusParam?: string) {
    const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : 1;
    const limit = limitStr ? Math.max(1, parseInt(limitStr, 10)) : 12;
    const skip = (page - 1) * limit;

    let targetStatus: ApprovalStatus = ApprovalStatus.APPROVED;
    if (statusParam && Object.values(ApprovalStatus).includes(statusParam as ApprovalStatus)) {
      targetStatus = statusParam as ApprovalStatus;
    }

    const whereCondition = { status: targetStatus };

    const [posts, total] = await Promise.all([
      this.prisma.galeri.findMany({
        where: whereCondition,
        skip,
        take: limit,
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
          likes: {
            select: {
              user_id: true,
            },
          },
        },
      }),
      this.prisma.galeri.count({ where: whereCondition }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // 3. Mengambil postingan khusus untuk landing page (Hanya APPROVED, Maksimal 6 atau 8)
  async getLandingPosts(limitCount: number = 6) {
    return this.prisma.galeri.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
      },
      take: limitCount,
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
        likes: {
          select: {
            user_id: true,
          },
        },
      },
    });
  }

  // 4. Mengambil postingan pending khusus Moderasi Admin
  async getPendingPosts() {
    return this.prisma.galeri.findMany({
      where: {
        status: ApprovalStatus.PENDING,
      },
      orderBy: {
        created_at: 'asc',
      },
      include: {
        uploader: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            foto_profil: true,
            sekolah: {
              select: { nama_sekolah: true },
            },
          },
        },
      },
    });
  }

  // 5. Mengubah status moderasi galeri (APPROVED / REJECTED)
  async updatePostStatus(postId: string, status: ApprovalStatus) {
    const post = await this.prisma.galeri.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Postingan galeri tidak ditemukan.');
    }

    return this.prisma.galeri.update({
      where: { id: postId },
      data: { status },
    });
  }

  // 6. Cek status kuota upload user
  async getUserQuotaStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const count = await this.prisma.galeri.count({ where: { user_id: userId } });
    const isSiswa = user.role === RoleEnum.siswa;
    return {
      uploadedCount: count,
      maxQuota: isSiswa ? 1 : 999,
      isQuotaExceeded: isSiswa && count >= 1,
    };
  }

  // 7. Menghapus postingan galeri
  async deletePost(postId: string, userId: string, userRole: RoleEnum) {
    const post = await this.prisma.galeri.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Postingan galeri tidak ditemukan');
    }

    const postOwner = await this.prisma.user.findUnique({
      where: { id: post.user_id },
    });

    const requestor = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!requestor) {
      throw new ForbiddenException('Akses ditolak');
    }

    const isOwner = post.user_id === userId;
    const isAdmin = userRole === RoleEnum.admin;
    
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

  // 8. Toggle like pada postingan
  async toggleLike(postId: string, userId: string) {
    const existing = await this.prisma.galeriLike.findUnique({
      where: {
        galeri_id_user_id: {
          galeri_id: postId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      await this.prisma.galeriLike.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    } else {
      await this.prisma.galeriLike.create({
        data: {
          galeri_id: postId,
          user_id: userId,
        },
      });
      return { liked: true };
    }
  }
}

