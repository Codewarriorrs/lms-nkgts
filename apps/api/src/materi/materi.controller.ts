import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
}
