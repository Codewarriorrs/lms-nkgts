const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeding akun QA untuk LMS N-KGTS...');

  // 1. Dapatkan atau buat sekolah default
  let sekolah = await prisma.sekolah.findFirst();
  if (!sekolah) {
    sekolah = await prisma.sekolah.create({
      data: {
        nama_sekolah: 'SMK Negeri 1 Semarang',
        alamat: 'Jl. Pemuda No. 1, Semarang',
      },
    });
    console.log(`Sekolah dibuat: ${sekolah.nama_sekolah}`);
  } else {
    console.log(`Sekolah yang digunakan: ${sekolah.nama_sekolah}`);
  }

  // Hash password "password123"
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Buat / Upsert Akun Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nkgts.sch.id' },
    update: {},
    create: {
      email: 'admin@nkgts.sch.id',
      nama: 'Administrator TAM',
      password_hash: passwordHash,
      role: 'admin',
      sekolah_id: sekolah.id,
    },
  });
  console.log(`Akun Admin siap: ${admin.email}`);

  // 3. Buat / Upsert Akun Guru
  const guru = await prisma.user.upsert({
    where: { email: 'guru@nkgts.sch.id' },
    update: {},
    create: {
      email: 'guru@nkgts.sch.id',
      nama: 'Budi Santoso (Guru)',
      password_hash: passwordHash,
      role: 'guru',
      sekolah_id: sekolah.id,
    },
  });
  console.log(`Akun Guru siap: ${guru.email}`);

  // 4. Buat / Upsert Akun Siswa
  const siswa = await prisma.user.upsert({
    where: { email: 'siswa@nkgts.sch.id' },
    update: {},
    create: {
      email: 'siswa@nkgts.sch.id',
      nama: 'Andi Wijaya (Siswa)',
      password_hash: passwordHash,
      role: 'siswa',
      sekolah_id: sekolah.id,
      kelas: 'XII Otomotif 1',
      nis: '12345',
    },
  });
  console.log(`Akun Siswa siap: ${siswa.email}`);

  console.log('Seeding selesai sukses! Akun siap digunakan untuk login QA.');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
