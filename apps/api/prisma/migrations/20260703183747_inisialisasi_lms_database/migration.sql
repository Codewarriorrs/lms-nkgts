-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('admin', 'guru', 'siswa');

-- CreateEnum
CREATE TYPE "StatusGuruEnum" AS ENUM ('praktisi', 'kandidat', 'warga_sekolah');

-- CreateTable
CREATE TABLE "Sekolah" (
    "id" SERIAL NOT NULL,
    "nama_sekolah" VARCHAR(150) NOT NULL,
    "alamat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "sekolah_id" INTEGER,
    "nama" VARCHAR(150) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "RoleEnum" NOT NULL,
    "status_guru" "StatusGuruEnum",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sekolah_nama_sekolah_key" ON "Sekolah"("nama_sekolah");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "Sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
