-- CreateTable
CREATE TABLE "latihan_soal" (
    "id" SERIAL NOT NULL,
    "modul_teori_id" INTEGER NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "pilihan" JSONB NOT NULL,
    "jawaban_benar" INTEGER NOT NULL,
    "poin" INTEGER NOT NULL DEFAULT 10,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "latihan_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai_latsol" (
    "id" SERIAL NOT NULL,
    "siswa_id" UUID NOT NULL,
    "modul_teori_id" INTEGER NOT NULL,
    "skor" INTEGER NOT NULL,
    "total_poin" INTEGER NOT NULL,
    "disubmit_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nilai_latsol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nilai_latsol_siswa_id_modul_teori_id_key" ON "nilai_latsol"("siswa_id", "modul_teori_id");

-- AddForeignKey
ALTER TABLE "latihan_soal" ADD CONSTRAINT "latihan_soal_modul_teori_id_fkey" FOREIGN KEY ("modul_teori_id") REFERENCES "modul_teori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_latsol" ADD CONSTRAINT "nilai_latsol_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_latsol" ADD CONSTRAINT "nilai_latsol_modul_teori_id_fkey" FOREIGN KEY ("modul_teori_id") REFERENCES "modul_teori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
