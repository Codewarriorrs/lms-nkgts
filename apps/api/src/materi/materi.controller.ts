import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';
import { MateriService } from './materi.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateMateriDto } from './dto/update-materi.dto';

@Controller('materi')
@UseGuards(JwtAuthGuard)
export class MateriController {
  constructor(private readonly materiService: MateriService) {}

  @Get('progress')
  async getProgress(@Req() req: any) {
    return this.materiService.getProgress(req.user.id);
  }

  @Post('progress')
  async updateProgress(@Req() req: any, @Body() dto: UpdateProgressDto) {
    return this.materiService.updateProgress(req.user.id, dto);
  }

  @Post('quiz')
  async submitQuiz(@Req() req: any, @Body() dto: SubmitQuizDto) {
    return this.materiService.submitQuiz(req.user.id, dto);
  }

  @Get('all-modules')
  async dapatkanSemuaModul() {
    return this.materiService.getAllModules();
  }

  @Get('modules/:slug')
  async getModuleDetails(@Param('slug') slug: string) {
    return this.materiService.getModuleDetails(slug);
  }

  @Patch('modules/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.guru)
  async updateModuleContent(
    @Param('id', ParseIntPipe) id: number,
    @Body('deskripsi') deskripsi: string,
  ) {
    return this.materiService.updateModuleContent(id, deskripsi);
  }

  // GET /materi/students-progress (Guru/Admin only)
  @Get('students-progress')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async dapatkanProgresSiswa(@Req() req: any) {
    return this.materiService.getStudentsProgress(req.user.id);
  }

  // POST /materi/create (Guru/Admin only)
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async buatModul(
    @Body('judul') judul: string,
    @Body('deskripsi') deskripsi: string,
    @Body('slug') slug: string,
    @Body('urutan', ParseIntPipe) urutan: number
  ) {
    return this.materiService.createModule(judul, deskripsi, slug, urutan);
  }

  // PATCH /materi/edit/:id (Guru/Admin only)
  @Patch('edit/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async editModul(
    @Param('id', ParseIntPipe) id: number,
    @Body('judul') judul: string,
    @Body('deskripsi') deskripsi: string,
    @Body('slug') slug: string,
    @Body('urutan', ParseIntPipe) urutan: number
  ) {
    return this.materiService.editModule(id, judul, deskripsi, slug, urutan);
  }

  // DELETE /materi/:id (Guru/Admin only)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async hapusModul(@Param('id', ParseIntPipe) id: number) {
    return this.materiService.deleteModule(id);
  }

  // POST /materi/soal/create (Guru/Admin only)
  @Post('soal/create')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async buatSoalLatihan(
    @Body('modul_teori_id', ParseIntPipe) modulTeoriId: number,
    @Body('pertanyaan') pertanyaan: string,
    @Body('pilihan_a') pilihanA: string,
    @Body('pilihan_b') pilihanB: string,
    @Body('pilihan_c') pilihanC: string,
    @Body('pilihan_d') pilihanD: string,
    @Body('jawaban_benar', ParseIntPipe) jawabanBenar: number
  ) {
    return this.materiService.createSoal(modulTeoriId, pertanyaan, pilihanA, pilihanB, pilihanC, pilihanD, jawabanBenar);
  }

  // DELETE /materi/soal/:id (Guru/Admin only)
  @Delete('soal/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async hapusSoalLatihan(@Param('id', ParseIntPipe) id: number) {
    return this.materiService.deleteSoal(id);
  }

  // PATCH /materi/:id (Guru/Admin only)
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.guru)
  async update(
    @Param('id') id: string,
    @Body() updateMateriDto: UpdateMateriDto,
  ) {
    return this.materiService.update(id, updateMateriDto);
  }
}
