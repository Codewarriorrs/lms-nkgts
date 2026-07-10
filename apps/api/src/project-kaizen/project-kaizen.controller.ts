import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectKaizenService } from './project-kaizen.service';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { ReviewProjectDto } from './dto/review-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';

@Controller('project-kaizen')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectKaizenController {
  constructor(private readonly projectKaizenService: ProjectKaizenService) {}

  // GET /project-kaizen/status-siswa -> melihat status pengumpulan project pribadi (siswa)
  @Get('status-siswa')
  @Roles(RoleEnum.siswa)
  async dapatkanStatusSaya(@Req() req: any) {
    return this.projectKaizenService.getSiswaProjects(req.user.id);
  }

  // POST /project-kaizen/submit -> siswa mengumpulkan proposal / laporan
  @Post('submit')
  @Roles(RoleEnum.siswa)
  async kumpulkanProject(@Body() dto: SubmitProjectDto, @Req() req: any) {
    return this.projectKaizenService.submitProject(req.user.id, dto);
  }

  // GET /project-kaizen/all -> guru melihat semua project siswa di sekolahnya
  @Get('all')
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async dapatkanSemuaProject(@Req() req: any) {
    return this.projectKaizenService.getAllProjects(req.user.id);
  }

  // PATCH /project-kaizen/review/:id -> guru melakukan review, memberi nilai & upload revisi
  @Patch('review/:id')
  @Roles(RoleEnum.guru, RoleEnum.admin)
  async reviewProject(
    @Param('id') id: string,
    @Body() dto: ReviewProjectDto
  ) {
    return this.projectKaizenService.reviewProject(id, dto);
  }
}
