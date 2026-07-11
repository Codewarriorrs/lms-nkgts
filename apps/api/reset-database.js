const { PrismaClient } = require('./generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai Pembersihan Total Database (Reset Data Base64)...');

  // Menghapus data dengan urutan dependensi yang benar untuk menghindari error foreign key constraints
  
  console.log('1. Menghapus data Nilai Latihan Soal (NilaiLatsol)...');
  await prisma.nilaiLatsol.deleteMany();

  console.log('2. Menghapus data Butir Latihan Soal (LatihanSoal)...');
  await prisma.latihanSoal.deleteMany();

  console.log('3. Menghapus submisi file Project Kaizen (FileProject)...');
  await prisma.fileProject.deleteMany();

  console.log('4. Menghapus submisi Tugas Praktek (SubmisiPraktek)...');
  await prisma.submisiPraktek.deleteMany();

  console.log('5. Menghapus data Nilai Kuis Teori (NilaiLatihan)...');
  await prisma.nilaiLatihan.deleteMany();

  console.log('6. Menghapus data Progres Membaca (ProgresTeori)...');
  await prisma.progresTeori.deleteMany();

  console.log('7. Menghapus data Modul Teori (ModulTeori)...');
  await prisma.modulTeori.deleteMany();

  console.log('\nReset Database Berhasil! Semua data lama yang mengandung Base64 telah dibersihkan.');
  console.log('Silakan jalankan kembali server backend (npm run dev) agar backend menginisialisasi ulang 5 modul default dengan data bersih.');
}

main()
  .catch((e) => {
    console.error('Error saat melakukan reset database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
