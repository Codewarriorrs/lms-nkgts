-- CreateEnum
CREATE TYPE "ProgresEnum" AS ENUM ('belum_dimulai', 'sedang_dibaca', 'selesai');

-- CreateTable
CREATE TABLE "topik_pelatihan" (
    "id" SERIAL NOT NULL,
    "nama_topik" VARCHAR(150) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topik_pelatihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modul_teori" (
    "id" SERIAL NOT NULL,
    "topik_id" INTEGER NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "file_pdf_url" VARCHAR(255),
    "urutan" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modul_teori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progres_teori" (
    "id" SERIAL NOT NULL,
    "siswa_id" UUID NOT NULL,
    "modul_teori_id" INTEGER NOT NULL,
    "status" "ProgresEnum" NOT NULL DEFAULT 'belum_dimulai',
    "persentase" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progres_teori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai_latihan" (
    "id" SERIAL NOT NULL,
    "siswa_id" UUID NOT NULL,
    "modul_teori_id" INTEGER NOT NULL,
    "skor" INTEGER NOT NULL,
    "disubmit_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nilai_latihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soal_latihan" (
    "id" SERIAL NOT NULL,
    "modul_teori_id" INTEGER NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "pilihan_a" TEXT NOT NULL,
    "pilihan_b" TEXT NOT NULL,
    "pilihan_c" TEXT NOT NULL,
    "pilihan_d" TEXT NOT NULL,
    "jawaban_benar" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soal_latihan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modul_teori_slug_key" ON "modul_teori"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "progres_teori_siswa_id_modul_teori_id_key" ON "progres_teori"("siswa_id", "modul_teori_id");

-- AddForeignKey
ALTER TABLE "modul_teori" ADD CONSTRAINT "modul_teori_topik_id_fkey" FOREIGN KEY ("topik_id") REFERENCES "topik_pelatihan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progres_teori" ADD CONSTRAINT "progres_teori_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progres_teori" ADD CONSTRAINT "progres_teori_modul_teori_id_fkey" FOREIGN KEY ("modul_teori_id") REFERENCES "modul_teori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_latihan" ADD CONSTRAINT "nilai_latihan_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_latihan" ADD CONSTRAINT "nilai_latihan_modul_teori_id_fkey" FOREIGN KEY ("modul_teori_id") REFERENCES "modul_teori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal_latihan" ADD CONSTRAINT "soal_latihan_modul_teori_id_fkey" FOREIGN KEY ("modul_teori_id") REFERENCES "modul_teori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
