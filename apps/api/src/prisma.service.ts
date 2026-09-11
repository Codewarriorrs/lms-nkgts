import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureSchemaSync();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureSchemaSync() {
    try {
      this.logger.log('Checking and synchronizing database schema columns...');
      const schemaSqlStatements = [
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_token" VARCHAR(255)`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_expires" TIMESTAMP(3)`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nis" VARCHAR(50)`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kelas" VARCHAR(20)`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "no_hp" VARCHAR(20)`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tanggal_lahir" DATE`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tahun_pendaftaran" INTEGER`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "foto_profil" TEXT`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tempat_lahir" VARCHAR(100)`,
        `ALTER TABLE "modul_teori" ADD COLUMN IF NOT EXISTS "latsol_bisa_ulang" BOOLEAN DEFAULT false`,
        `ALTER TABLE "progres_teori" ADD COLUMN IF NOT EXISTS "persentase" INTEGER DEFAULT 0`,
        `ALTER TABLE "submisi_praktek" ADD COLUMN IF NOT EXISTS "detail_jawaban" JSONB`,
        `ALTER TABLE "invitation_tokens" ADD COLUMN IF NOT EXISTS "kelas" VARCHAR(20)`
      ];

      for (const sql of schemaSqlStatements) {
        await this.$executeRawUnsafe(sql).catch((err) => {
          this.logger.warn(`Schema sync statement warning: ${err.message}`);
        });
      }
      this.logger.log('Database columns synchronized successfully.');
    } catch (err: any) {
      this.logger.error('Failed to auto-sync schema columns:', err);
    }
  }
}

