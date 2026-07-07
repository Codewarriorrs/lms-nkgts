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
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvitationService } from './invitation.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../../generated/prisma';

@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // ================= ADMIN ROUTE ENDPOINTS =================

  // 1. Import pengguna massal via Excel/CSV
  @Post('admin/users/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.admin)
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body('sekolah_id', ParseIntPipe) sekolahId: number,
  ) {
    if (!file) {
      throw new BadRequestException('Unggah file .xlsx atau .csv terlebih dahulu');
    }
    return this.invitationService.importUsers(file, sekolahId);
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
}
