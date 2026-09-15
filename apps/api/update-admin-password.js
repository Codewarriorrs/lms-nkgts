const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Mengubah kata sandi akun Admin...');
  const newPasswordHash = await bcrypt.hash('kaizenuntukindonesia1945', 10);

  const emailsToUpdate = ['admin@nkgts.com', 'admin@nkgts.sch.id'];

  for (const email of emailsToUpdate) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { password_hash: newPasswordHash }
      });
      console.log(`Berhasil memperbarui kata sandi untuk: ${email}`);
    } else {
      console.log(`Pengguna dengan email ${email} belum ada di DB.`);
    }
  }

  // Juga pastikan admin@nkgts.com ada jika belum pernah dibuat
  const existingComAdmin = await prisma.user.findUnique({ where: { email: 'admin@nkgts.com' } });
  if (!existingComAdmin) {
    let sekolah = await prisma.sekolah.findFirst();
    if (!sekolah) {
      sekolah = await prisma.sekolah.create({
        data: { nama_sekolah: 'N-KGTS Pusat' }
      });
    }
    await prisma.user.create({
      data: {
        email: 'admin@nkgts.com',
        nama: 'Administrator NKGTS',
        password_hash: newPasswordHash,
        role: 'admin',
        sekolah_id: sekolah.id
      }
    });
    console.log('Berhasil membuat akun admin@nkgts.com baru dengan kata sandi kaizenuntukindonesia1945');
  }
}

main()
  .catch((e) => {
    console.error('Gagal memperbarui kata sandi admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
