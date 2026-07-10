import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { TugasPraktekService } from './tugas-praktek.service';
import { CreateTugasPraktekDto } from './dto/create-tugas-praktek.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';

@Controller('tugas-praktek')
@UseGuards(JwtAuthGuard, RolesGuard) // Mengunci rute ini dengan sistem login JWT
export class TugasPraktekController {
  constructor(private readonly tugasPraktekService: TugasPraktekService) {}

  // Endpoint: GET http://localhost:PORT/api/tugas-praktek/status-siswa
  @Get('status-siswa')
  @Roles(RoleEnum.siswa) // Hanya akun ber-role siswa yang boleh mengakses data ini
  async dapatkanStatusSaya(@Req() req: any) {
    // req.user.id didapatkan otomatis setelah lolos dari verifikasi JwtAuthGuard
    return this.tugasPraktekService.getSiswaSubmisi(req.user.id);
  }

  // Endpoint: POST http://localhost:PORT/api/tugas-praktek/:id/submit
  @Post(':id/submit')
  @Roles(RoleEnum.siswa) // Hanya siswa yang diizinkan mengumpulkan tugas praktikum
  async kumpulkanTugas(
    @Param('id', ParseIntPipe) id: number, // Mengubah parameter string ':id' di URL menjadi integer angka resmi
    @Body() dto: CreateTugasPraktekDto,
    @Req() req: any
  ) {
    return this.tugasPraktekService.submitTugas(req.user.id, id, dto);
  }

  // Endpoint: GET http://localhost:PORT/api/tugas-praktek/all (Guru & Admin Only)
  @Get('all')
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async dapatkanSemuaTugasSiswa(@Req() req: any) {
    return this.tugasPraktekService.getAllSubmisi(req.user.id);
  }

  // Endpoint: PATCH http://localhost:PORT/api/tugas-praktek/submisi/:submisiId/grade (Guru & Admin Only)
  @Patch('submisi/:submisiId/grade')
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async beriNilaiTugas(
    @Param('submisiId') submisiId: string,
    @Body('nilai', ParseIntPipe) nilai: number,
    @Body('catatan_guru') catatanGuru?: string
  ) {
    return this.tugasPraktekService.gradeSubmisi(submisiId, nilai, catatanGuru);
  }
}