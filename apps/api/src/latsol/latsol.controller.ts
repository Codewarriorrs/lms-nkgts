import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { LatsolService } from './latsol.service';
import { CreateLatsolDto } from './dto/create-latsol.dto';
import { SubmitLatsolDto } from './dto/submit-latsol.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';

@Controller('latsol')
@UseGuards(JwtAuthGuard)
export class LatsolController {
  constructor(private readonly latsolService: LatsolService) {}

  // 1. Tambah soal kuis latihan baru (Guru & Admin)
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async create(@Body() createLatsolDto: CreateLatsolDto) {
    return this.latsolService.createQuestion(createLatsolDto);
  }

  // 2. Hapus soal kuis latihan (Guru & Admin)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.latsolService.deleteQuestion(id);
  }

  // 3. Lihat status prasyarat latsol semua modul (Siswa)
  @Get('status-siswa')
  async getStatus(@Req() req: any) {
    const userId = req.user.userId;
    return this.latsolService.getLatsolStatusForStudent(userId);
  }

  // 4. Ambil daftar soal kuis latihan untuk modul tertentu
  @Get('modules/:id')
  async getQuestions(
    @Param('id', ParseIntPipe) moduleId: number,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    const isGuru = req.user.role === RoleEnum.guru || req.user.role === RoleEnum.admin;
    return this.latsolService.getQuestionsForModule(moduleId, isGuru, userId);
  }

  // 5. Submit & hitung hasil pengerjaan kuis latihan (Siswa)
  @Post('submit')
  async submit(@Req() req: any, @Body() submitLatsolDto: SubmitLatsolDto) {
    const userId = req.user.userId;
    return this.latsolService.submitStudentLatsol(userId, submitLatsolDto);
  }
}
