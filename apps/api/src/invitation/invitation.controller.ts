import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Patch, 
  Body, 
  Query, 
  Param, 
  ParseIntPipe, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvitationService } from './invitation.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { ExportNilaiDto } from './dto/export-nilai.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';

import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // ================= ADMIN ROUTE ENDPOINTS =================

  // 0. Unduh template Excel impor pengguna (.xlsx)
  @Get('admin/users/download-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async downloadTemplate(@Res() res: Response) {
    const candidatePaths = [
      path.join(process.cwd(), '../web/public/Template_Import_Pengguna_NKGTS.xlsx'),
      path.join(process.cwd(), 'public/Template_Import_Pengguna_NKGTS.xlsx'),
      path.join(process.cwd(), 'Template_Import_Pengguna_NKGTS.xlsx'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_Pengguna_NKGTS.xlsx"');
        return res.sendFile(path.resolve(p));
      }
    }

    // Fallback redirect ke Biznet Storage S3 URL
    return res.redirect('https://nos.wjv-1.neo.id/kaizen-files/templates/Template_Import_Pengguna_NKGTS.xlsx');
  }

  // 1. Import pengguna massal via Excel/CSV
  @Post('admin/users/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body('sekolah_id') sekolahIdRaw?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Unggah file .xlsx atau .csv terlebih dahulu');
    }
    const sekolahId = sekolahIdRaw ? parseInt(sekolahIdRaw, 10) : undefined;
    return this.invitationService.importUsers(file, isNaN(sekolahId as number) ? undefined : sekolahId);
  }

  // 2. Undang pengguna secara manual
  @Post('admin/users/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async inviteManual(@Body() inviteUserDto: InviteUserDto) {
    return this.invitationService.inviteManual(inviteUserDto);
  }

  // 3. Lihat daftar pengguna aktif
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async getActiveUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const searchStr = search || '';
    
    let roleEnum: RoleEnum | undefined;
    if (role === 'admin') roleEnum = RoleEnum.admin;
    else if (role === 'guru') roleEnum = RoleEnum.guru;
    else if (role === 'siswa') roleEnum = RoleEnum.siswa;

    return this.invitationService.getActiveUsers(pageNum, limitNum, searchStr, roleEnum);
  }

  // 4. Lihat daftar undangan pending (tertunda)
  @Get('admin/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async getPendingInvitations() {
    return this.invitationService.getPendingInvitations();
  }

  // 5. Hapus / batalkan undangan pending
  @Delete('admin/invitations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async deleteInvitation(@Param('id', ParseIntPipe) id: number) {
    return this.invitationService.deleteInvitation(id);
  }

  // 6. Kirim ulang email undangan
  @Post('admin/invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async resendInvitation(@Param('id', ParseIntPipe) id: number) {
    return this.invitationService.resendInvitation(id);
  }

  // 7. Ambil kontak CP
  @Get('admin/settings/email-contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async getContactSettings() {
    return this.invitationService.getContactSettings();
  }

  // 8. Perbarui kontak CP
  @Patch('admin/settings/email-contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async updateContactSettings(@Body() updateContactDto: UpdateContactDto) {
    return this.invitationService.updateContactSettings(updateContactDto);
  }

  // ================= PUBLIC ROUTE ENDPOINTS =================

  // 9. Validasi token undangan di halaman registrasi
  @Get('auth/activate')
  async validateToken(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token tidak boleh kosong');
    }
    return this.invitationService.validateActivationToken(token);
  }

  // 10. Konfirmasi aktivasi dan set password baru
  @Post('auth/activate')
  async activateAccount(@Body() activateAccountDto: ActivateAccountDto) {
    return this.invitationService.activateAccount(activateAccountDto);
  }

  // 11. Update role & data pengguna (Admin only)
  @Patch('admin/users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async updateRole(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.invitationService.updateUser(id, dto);
  }

  // 11b. Update data profil lengkap pengguna (Admin only)
  @Patch('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.invitationService.updateUser(id, dto);
  }

  // 12. Hapus pengguna (Admin only)
  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async deleteUser(@Param('id') id: string) {
    return this.invitationService.deleteUser(id);
  }

  // 13. Reset progres belajar (Admin only)
  @Patch('admin/users/:id/reset-progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async resetProgress(
    @Param('id') id: string,
    @Body() resetProgressDto: ResetProgressDto
  ) {
    return this.invitationService.resetProgress(id, resetProgressDto.startFromModule, resetProgressDto.resetType);
  }

  // 14. Tarik data rekapitulasi nilai (Export to Excel)
  @Get('admin/export-nilai')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async exportNilai(
    @Query() query: ExportNilaiDto,
    @Res() res: Response
  ) {
    const buffer = await this.invitationService.exportNilaiBuffer(query.sekolah_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="rekap_nilai_lms_nkgts.xlsx"');
    res.send(buffer);
  }

  // 15. Kirim email petunjuk atur ulang kata sandi (Admin only)
  @Post('admin/users/:id/send-reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async sendResetPasswordEmail(@Param('id') id: string) {
    return this.invitationService.sendResetPasswordEmail(id);
  }

  // 16. Ambil daftar pengguna dengan token reset password aktif (Admin only)
  @Get('admin/users/active-resets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async getActiveResetPasswordUsers() {
    return this.invitationService.getActiveResetPasswordUsers();
  }

  // 17. Batalkan tautan reset password pengguna (Admin only)
  @Delete('admin/users/:id/cancel-reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async cancelResetPasswordToken(@Param('id') id: string) {
    return this.invitationService.cancelResetPasswordToken(id);
  }

  // ================= BULK ACTIONS (AKSI MASSAL) =================

  // 18. Hapus massal akun pengguna aktif (Admin only)
  @Post('admin/users/bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkDeleteUsers(@Body() dto: BulkActionDto, @Req() req: any) {
    return this.invitationService.bulkDeleteUsers(dto.ids, req.user?.id);
  }

  // 19. Kirim massal link reset sandi pengguna aktif (Admin only)
  @Post('admin/users/bulk-send-reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkSendResetPassword(@Body() dto: BulkActionDto) {
    return this.invitationService.bulkSendResetPassword(dto.ids);
  }

  // 20. Hapus massal undangan tertunda (Admin only)
  @Post('admin/invitations/bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkDeleteInvitations(@Body() dto: BulkActionDto) {
    return this.invitationService.bulkDeleteInvitations(dto.ids);
  }

  // 21. Kirim ulang massal email undangan (Admin only)
  @Post('admin/invitations/bulk-resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkResendInvitations(@Body() dto: BulkActionDto) {
    return this.invitationService.bulkResendInvitations(dto.ids);
  }

  // 22. Batalkan/Hapus massal tautan reset sandi aktif (Admin only)
  @Post('admin/resets/bulk-cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkCancelResetPassword(@Body() dto: BulkActionDto) {
    return this.invitationService.bulkCancelResetPassword(dto.ids);
  }

  @Post('admin/resets/bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkDeleteResets(@Body() dto: BulkActionDto) {
    return this.invitationService.bulkCancelResetPassword(dto.ids);
  }

  @Post('admin/resets/bulk-resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  async bulkResendResetPassword(@Body() dto: BulkActionDto) {
    return this.invitationService.bulkSendResetPassword(dto.ids);
  }
}

