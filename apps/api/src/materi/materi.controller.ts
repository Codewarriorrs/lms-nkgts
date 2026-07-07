import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';
import { MateriService } from './materi.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

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

  @Get('modules/:slug')
  async getModuleDetails(@Param('slug') slug: string) {
    return this.materiService.getModuleDetails(slug);
  }

  @Patch('modules/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.admin)
  async updateModuleContent(
    @Param('id', ParseIntPipe) id: number,
    @Body('deskripsi') deskripsi: string,
  ) {
    return this.materiService.updateModuleContent(id, deskripsi);
  }
}
