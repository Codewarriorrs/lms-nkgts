const { PrismaClient } = require('./generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai pembersihan data gambar Base64 di Neon Database...');

  // 1. Ambil semua ModulTeori
  const modules = await prisma.modulTeori.findMany();
  console.log(`Ditemukan ${modules.length} modul teori.`);

  let updatedCount = 0;

  for (const mod of modules) {
    if (mod.deskripsi && mod.deskripsi.includes('data:image/')) {
      console.log(`Membersihkan base64 di modul: "${mod.judul}" (ID: ${mod.id})...`);
      
      // Hapus konten base64 di dalam tag src="data:image/..." menjadi src=""
      const cleanedDeskripsi = mod.deskripsi.replace(/src="data:image\/[^"]+"/g, 'src=""');
      
      await prisma.modulTeori.update({
        where: { id: mod.id },
        data: {
          deskripsi: cleanedDeskripsi
        }
      });
      
      updatedCount++;
    }
  }

  // 2. Ambil semua User untuk membersihkan foto profil base64 lama
  const users = await prisma.user.findMany();
  let updatedUsersCount = 0;

  for (const user of users) {
    if (user.foto_profil && user.foto_profil.includes('data:image/')) {
      console.log(`Membersihkan foto profil base64 untuk pengguna: ${user.email}...`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          foto_profil: null // Reset ke default avatar
        }
      });
      updatedUsersCount++;
    }
  }

  // 3. Ambil semua LatihanSoal untuk membersihkan gambar soal base64
  const soalList = await prisma.latihanSoal.findMany();
  let updatedSoalCount = 0;

  for (const soal of soalList) {
    if (soal.image_url && soal.image_url.includes('data:image/')) {
      console.log(`Membersihkan gambar soal base64 (ID Soal: ${soal.id})...`);
      
      await prisma.latihanSoal.update({
        where: { id: soal.id },
        data: {
          image_url: null
        }
      });
      updatedSoalCount++;
    }
  }

  console.log(`\nHasil Pembersihan:`);
  console.log(`- ${updatedCount} modul dibersihkan dari Base64.`);
  console.log(`- ${updatedUsersCount} foto profil siswa/guru di-reset ke default.`);
  console.log(`- ${updatedSoalCount} gambar kuis latihan soal dibersihkan.`);
  console.log('Selesai! Database Neon Anda sekarang bersih dan sangat cepat.');
}

main()
  .catch((e) => {
    console.error('Gagal menjalankan pembersihan:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
