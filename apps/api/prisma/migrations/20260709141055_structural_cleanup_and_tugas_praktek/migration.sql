/*
  Warnings:

  - You are about to drop the column `status_guru` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "status_guru",
ADD COLUMN     "kelas" VARCHAR(20),
ADD COLUMN     "no_hp" VARCHAR(20),
ADD COLUMN     "tahun_pendaftaran" INTEGER,
ADD COLUMN     "tanggal_lahir" DATE;

-- DropEnum
DROP TYPE "StatusGuruEnum";

-- CreateTable
CREATE TABLE "tugas_praktek" (
    "id" SERIAL NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tugas_praktek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submisi_praktek" (
    "id" UUID NOT NULL,
    "tugas_praktek_id" INTEGER NOT NULL,
    "siswa_id" UUID NOT NULL,
    "tanggal" VARCHAR(10) NOT NULL,
    "area_pengisian" TEXT NOT NULL,
    "keterangan" TEXT,
    "nilai" INTEGER,
    "catatan_guru" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submisi_praktek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submisi_praktek_siswa_id_tugas_praktek_id_key" ON "submisi_praktek"("siswa_id", "tugas_praktek_id");

-- AddForeignKey
ALTER TABLE "submisi_praktek" ADD CONSTRAINT "submisi_praktek_tugas_praktek_id_fkey" FOREIGN KEY ("tugas_praktek_id") REFERENCES "tugas_praktek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submisi_praktek" ADD CONSTRAINT "submisi_praktek_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
