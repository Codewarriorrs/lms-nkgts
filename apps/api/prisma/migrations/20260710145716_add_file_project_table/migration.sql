-- CreateTable
CREATE TABLE "file_project" (
    "id" UUID NOT NULL,
    "siswa_id" UUID NOT NULL,
    "tipe" VARCHAR(50) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "catatan_siswa" TEXT,
    "file_revisi_url" TEXT,
    "file_revisi_name" VARCHAR(255),
    "catatan_guru" TEXT,
    "nilai" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_project" ADD CONSTRAINT "file_project_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
