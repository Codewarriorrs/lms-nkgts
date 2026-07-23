import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { GaleriService } from './galeri.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('galeri')
export class GaleriController {
  constructor(private readonly galeriService: GaleriService) {}

  // 1. Mengambil postingan khusus untuk landing page (Public)
  @Get('landing')
  async getLandingPosts() {
    return this.galeriService.getLandingPosts();
  }

  // 2. Mengambil semua postingan galeri (Protected)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPosts() {
    return this.galeriService.getAllPosts();
  }

  // 3. Membuat postingan galeri baru (Protected)
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

  // 4. Menghapus postingan galeri (Protected)
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
}
