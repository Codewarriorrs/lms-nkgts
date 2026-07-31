import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  Req 
} from '@nestjs/common';
import { GaleriService } from './galeri.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum, ApprovalStatus } from '../../generated/prisma';

@Controller('galeri')
export class GaleriController {
  constructor(private readonly galeriService: GaleriService) {}

  // 1. Mengambil postingan khusus untuk landing page (Public)
  @Get('landing')
  async getLandingPosts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 6;
    return this.galeriService.getLandingPosts(limitNum);
  }

  // 2. Cek status kuota upload user (Protected)
  @Get('quota')
  @UseGuards(JwtAuthGuard)
  async getUserQuotaStatus(@Req() req: any) {
    return this.galeriService.getUserQuotaStatus(req.user.id);
  }

  // 3. Mengambil postingan pending khusus Moderasi Admin (Admin Only)
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async getPendingPosts() {
    return this.galeriService.getPendingPosts();
  }

  // 4. Mengambil postingan galeri publik (Protected - Paginasi & Filter)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.galeriService.getAllPosts(page, limit, status);
  }

  // 5. Membuat postingan galeri baru (Protected - Dengan Pengecekan Kuota 1 Foto untuk Siswa)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Req() req: any,
    @Body('judul') judul: string,
    @Body('deskripsi') deskripsi: string,
    @Body('foto_url') fotoUrl: string,
  ) {
    const userId = req.user.id;
    return this.galeriService.createPost(userId, { judul, deskripsi, foto_url: fotoUrl });
  }

  // 6. Moderasi postingan (Approve / Reject) (Admin Only)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async updatePostStatus(
    @Param('id') id: string,
    @Body('status') status: ApprovalStatus,
  ) {
    return this.galeriService.updatePostStatus(id, status);
  }

  // 7. Menghapus postingan galeri (Protected)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Req() req: any,
    @Param('id') id: string
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.galeriService.deletePost(id, userId, userRole);
  }

  // 8. Toggle like postingan galeri (Protected)
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Req() req: any,
    @Param('id') id: string
  ) {
    const userId = req.user.id;
    return this.galeriService.toggleLike(id, userId);
  }
}

