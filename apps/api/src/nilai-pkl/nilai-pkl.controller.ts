import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { NilaiPklService } from './nilai-pkl.service';
import { SubmitNilaiPklDto } from './dto/submit-nilai-pkl.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';

@Controller('nilai-pkl')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NilaiPklController {
  constructor(private readonly nilaiPklService: NilaiPklService) {}

  // POST /nilai-pkl -> Guru & Admin memberi/mengubah nilai PKL siswa
  @Post()
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async submitGrade(@Req() req: any, @Body() dto: SubmitNilaiPklDto) {
    return this.nilaiPklService.submitGrade(req.user.id, dto);
  }

  // GET /nilai-pkl/students -> Guru & Admin melihat daftar siswa beserta nilainya
  @Get('students')
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async getStudentsList(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 50;
    const sId = schoolId ? Number(schoolId) : undefined;
    return this.nilaiPklService.getStudentsList(req.user, p, l, search, sId);
  }

  // GET /nilai-pkl/my-grade -> Siswa melihat hasil penilaian PKL mereka sendiri
  @Get('my-grade')
  @Roles(RoleEnum.siswa)
  async getMyGrade(@Req() req: any) {
    return this.nilaiPklService.getMyGrade(req.user.id);
  }
}
