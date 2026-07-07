import { Controller, Get, Post, Body, HttpCode, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller()
export class AppController implements OnModuleInit {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedUsersIfEmpty();
    await this.seedMateriIfEmpty();
  }

  private async seedMateriIfEmpty() {
    try {
      const topicCount = await this.prisma.topikPelatihan.count();
      if (topicCount === 0) {
        console.log('Database topik/modul is empty. Seeding initial training materials...');
        
        // 1. Create Topik
        const topik = await this.prisma.topikPelatihan.create({
          data: {
            nama_topik: 'National Kaizen Goes To School',
            deskripsi: 'Pelatihan budaya industri Kaizen, Budaya Kerja 5R, Keselamatan Kerja K3, dan Pemecahan Masalah 8 Langkah.',
          }
        });

        // 2. Define Modules & Quizzes
        const modules = [
          {
            judul: 'Pengenalan Budaya Kaizen',
            slug: 'pengenalan-kaizen',
            deskripsi: 'Memahami fondasi Kaizen, sejarah, pelaku, dan pentingnya budaya perbaikan berkelanjutan di sekolah dan industri.',
            urutan: 1,
            quiz: [
              {
                question: 'Kaizen berasal dari bahasa Jepang yang bermakna...',
                options: ['Perubahan Instan', 'Perubahan Baik / Perbaikan Berkelanjutan', 'Efisiensi Biaya', 'Produksi Massal'],
                correct: 1
              },
              {
                question: 'Salah satu pilar penting Kaizen (TPS) dikembangkan oleh Toyota antara tahun...',
                options: ['1930-an', '1950-an', '1960-an s/d 1970-an', '1990-an'],
                correct: 2
              },
              {
                question: 'Siapa yang perlu melakukan Kaizen dalam suatu organisasi/sekolah?',
                options: ['Pimpinan puncak saja', 'Karyawan tingkat bawah saja', 'Hanya kepala bagian', 'Semua orang dalam organisasi/sekolah'],
                correct: 3
              }
            ]
          },
          {
            judul: 'Budaya Kerja 5R (Ringkas, Rapi, Resik, Rawat, Rajin)',
            slug: '5r',
            deskripsi: 'Belajar mendeteksi masalah di sekitar tempat kerja menggunakan prinsip 5R dan lembar periksa (checksheet).',
            urutan: 2,
            quiz: [
              {
                question: 'Menurut Taiichi Ohno, masalah terbesar dalam pekerjaan adalah...',
                options: ['Memiliki banyak kompetitor', 'Tidak memiliki masalah (mengaku tidak ada masalah)', 'Biaya produksi yang mahal', 'Kurangnya tenaga kerja'],
                correct: 1
              },
              {
                question: 'Situasi ideal yang diinginkan dikurangi situasi saat ini (aktual) disebut...',
                options: ['Solusi', 'Pencapaian', 'Target', 'Masalah (Problem)'],
                correct: 3
              },
              {
                question: 'Alat bantu visual yang biasa digunakan untuk menilai kondisi 5R di tempat kerja adalah...',
                options: ['Checksheet', 'Struktur Organisasi', 'Buku Panduan', 'Laporan Keuangan'],
                correct: 0
              }
            ]
          },
          {
            judul: 'K3: Identifikasi 6 Potensi Bahaya',
            slug: '6-potensi-bahaya',
            deskripsi: 'Menganalisis potensi kecelakaan kerja di rumah, sekolah, dan perjalanan menggunakan aktivitas Duga Bahaya.',
            urutan: 3,
            quiz: [
              {
                question: 'Berikut ini termasuk dalam 6 Potensi Bahaya Keselamatan Kerja, kecuali...',
                options: ['Tersengat listrik', 'Terjatuh', 'Terlambat bangun tidur', 'Tertimpa barang dari ketinggian'],
                correct: 2
              },
              {
                question: 'Aktivitas bertukar pengalaman mengenai peristiwa \'near-miss\' (hampir celaka) disebut...',
                options: ['Duga Bahaya', 'Audit Kerja', 'Evaluasi Kinerja', 'Rapat Koordinasi'],
                correct: 0
              },
              {
                question: 'Tujuan utama dari menilai risiko bahaya di sekolah/tempat kerja adalah...',
                options: ['Menghitung kerugian finansial', 'Mencari kambing hitam', 'Menentukan prioritas perbaikan (STOP 6 Bahaya)', 'Membuat aturan yang ketat'],
                correct: 2
              }
            ]
          },
          {
            judul: 'Identifikasi 7 Pemborosan (Waste)',
            slug: '7-pemborosan',
            deskripsi: 'Mendeteksi pemborosan yang tidak memberikan nilai tambah di lingkungan sekitar.',
            urutan: 4,
            quiz: [
              {
                question: 'Kerja bermutu adalah kerja yang menghasilkan...',
                options: ['Laba yang besar saja', 'Nilai tambah secara berkelanjutan', 'Produk dalam jumlah banyak', 'Waktu kerja yang lama'],
                correct: 1
              },
              {
                question: 'Menemukan pemborosan bertujuan untuk mengidentifikasi aktivitas yang...',
                options: ['Meningkatkan harga jual', 'Mempersingkat jam kerja', 'Tidak memberikan nilai tambah (non-value added)', 'Menyenangkan karyawan'],
                correct: 2
              },
              {
                question: 'Salah satu contoh pemborosan di sekitar rumah/sekolah adalah...',
                options: ['Menulis rencana belajar', 'Menaruh barang sesuai tempatnya', 'Gerakan/proses bolak-balik yang tidak perlu', 'Membaca buku materi'],
                correct: 2
              }
            ]
          },
          {
            judul: 'Sistematika 8 Langkah Penyelesaian Masalah',
            slug: '8-langkah-penyelesaian-masalah',
            deskripsi: 'Menguasai siklus PDCA dan metodologi 8 langkah pemecahan masalah untuk menyusun proposal perbaikan.',
            urutan: 5,
            quiz: [
              {
                question: 'Siklus utama dalam sistematika penyelesaian masalah adalah...',
                options: ['SDCA', 'PDCA (Plan-Do-Check-Action)', 'KPI', 'FIFO'],
                correct: 1
              },
              {
                question: 'Dua format dokumen utama yang biasa digunakan dalam proyek perbaikan adalah...',
                options: ['Daftar Hadir & Absensi', 'Proposal Perbaikan & Laporan Perkembangan Perbaikan', 'Kuitansi & Nota Belanja', 'CV & Lamaran Kerja'],
                correct: 1
              },
              {
                question: 'Karakter utama seorang \'Problem Solver\' adalah...',
                options: ['Menghindari masalah', 'Menyalahkan keadaan', 'Peduli, sadar masalah, dan aktif melakukan perbaikan', 'Menunggu instruksi pimpinan saja'],
                correct: 2
              }
            ]
          }
        ];

        // 3. Insert into DB
        for (const m of modules) {
          const createdModul = await this.prisma.modulTeori.create({
            data: {
              topik_id: topik.id,
              judul: m.judul,
              slug: m.slug,
              deskripsi: m.deskripsi,
              urutan: m.urutan
            }
          });

          for (const q of m.quiz) {
            await this.prisma.soalLatihan.create({
              data: {
                modul_teori_id: createdModul.id,
                pertanyaan: q.question,
                pilihan_a: q.options[0],
                pilihan_b: q.options[1],
                pilihan_c: q.options[2],
                pilihan_d: q.options[3],
                jawaban_benar: q.correct
              }
            });
          }
        }
        console.log('Seeding initial training materials completed successfully!');
      }
    } catch (error) {
      console.error('Failed to seed training materials:', error);
    }
  }

  private async seedUsersIfEmpty() {
    try {
      const count = await this.prisma.user.count();
      if (count === 0) {
        console.log('Database users table is empty. Seeding initial mock users...');
        const passwordHash = bcrypt.hashSync('password123', 10);
        
        const schoolNames = [
          'SMK Negeri 26 Jakarta',
          'SMK Negeri 2 Surabaya',
          'SMK Negeri 1 Semarang',
          'N-KGTS Pusat'
        ];

        const schoolsMap: Record<string, any> = {};

        for (const name of schoolNames) {
          let sekolah = await this.prisma.sekolah.findUnique({
            where: { nama_sekolah: name }
          });
          if (!sekolah) {
            sekolah = await this.prisma.sekolah.create({
              data: { nama_sekolah: name }
            });
          }
          schoolsMap[name] = sekolah;
        }

        const defaultUsers = [
          {
            email: 'isya@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Isya Asyhari',
            sekolah_id: schoolsMap['SMK Negeri 26 Jakarta'].id,
            role: 'siswa' as const,
          },
          {
            email: 'yesaya@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Yesaya',
            sekolah_id: schoolsMap['SMK Negeri 2 Surabaya'].id,
            role: 'siswa' as const,
          },
          {
            email: 'bintang@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Bintang',
            sekolah_id: schoolsMap['SMK Negeri 1 Semarang'].id,
            role: 'siswa' as const,
          },
          {
            email: 'budi@nkgts.sch.id',
            password_hash: passwordHash,
            nama: 'Budi Santoso',
            sekolah_id: schoolsMap['SMK Negeri 1 Semarang'].id,
            role: 'siswa' as const,
          },
          {
            email: 'admin@nkgts.com',
            password_hash: passwordHash,
            nama: 'Administrator',
            sekolah_id: schoolsMap['N-KGTS Pusat'].id,
            role: 'admin' as const,
          },
        ];

        for (const user of defaultUsers) {
          await this.prisma.user.create({ data: user });
        }
        console.log('Seeding initial mock users completed successfully!');
      }
    } catch (error) {
      console.error('Failed to seed default users:', error);
    }
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('schools')
  async getSchools() {
    return this.prisma.sekolah.findMany({
      orderBy: { nama_sekolah: 'asc' }
    });
  }
}

