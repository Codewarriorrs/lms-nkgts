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
    await this.seedTugasIfEmpty();
  }

  private async seedMateriIfEmpty() {
    try {
      let topik = await this.prisma.topikPelatihan.findFirst();
      if (!topik) {
        topik = await this.prisma.topikPelatihan.create({
          data: {
            nama_topik: 'National Kaizen Goes To School',
            deskripsi: 'Pelatihan budaya industri Kaizen, Budaya Kerja 5R, Keselamatan Kerja K3, dan Pemecahan Masalah 8 Langkah.',
          }
        });
      }

      // 2. Define Modules & Quizzes with rich HTML articles
      const modules = [
        {
          judul: 'Pengenalan Budaya Kaizen',
          slug: 'pengenalan-kaizen',
          deskripsi: `<p><strong>Kaizen</strong> adalah istilah dalam Bahasa Jepang yang secara harfiah bermakna <em>"Perubahan Baik"</em> atau <em>"Perbaikan Berkelanjutan"</em>. Konsep ini bukan tentang melakukan lompatan besar secara instan, melainkan bagaimana secara konstan menemukan celah kecil untuk dikembangkan demi terciptanya efisiensi yang lebih tinggi dan bebas pemborosan.</p>
<img src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?q=80&w=800&auto=format&fit=crop" alt="Kaizen Collaboration" class="rounded-2xl my-6 mx-auto max-w-full h-auto shadow-md border border-neutral-100" />
<h2>Sejarah Ringkas Kaizen</h2>
<p>Akar budaya Kaizen bermula pasca Perang Dunia II di Jepang. Salah satu tonggak utamanya adalah <strong>The Toyota Production System (TPS)</strong> yang dikembangkan antara tahun 1960-an s/d 1970-an. Melalui TPS, Toyota memelopori sistem produksi yang berfokus pada penghapusan pemborosan (waste) dan peningkatan alur kerja secara kolektif.</p>
<h2>Siapa Saja yang Harus Melakukan Kaizen?</h2>
<p>Dalam filosofi Kaizen, perbaikan bukanlah tanggung jawab pimpinan atau departemen kualitas saja. Semua orang wajib terlibat secara aktif:</p>
<ul>
  <li><strong>Pimpinan Puncak (Top Management):</strong> Merumuskan strategi besar dan memfasilitasi budaya Kaizen.</li>
  <li><strong>Pimpinan Menengah & Kepala Bagian:</strong> Mengarahkan implementasi praktis di divisi masing-masing.</li>
  <li><strong>Karyawan / Siswa:</strong> Ujung tombak yang menemukan masalah riil sehari-hari dan memberikan ide perbaikan harian.</li>
</ul>`,
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
          deskripsi: `<p>Sadar masalah adalah fondasi dari setiap perbaikan. Di tempat kerja maupun sekolah, salah satu tolok ukur kesadaran masalah yang paling mendasar dinilai dari kondisi kebersihan dan keteraturan areanya melalui prinsip <strong>5R (Ringkas, Rapi, Resik, Rawat, Rajin)</strong>.</p>
<img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" alt="Organized Industrial Workplace" class="rounded-2xl my-6 mx-auto max-w-full h-auto shadow-md border border-neutral-100" />
<h2>Prinsip Utama 5R</h2>
<ul>
  <li><strong>Ringkas:</strong> Memilah barang yang diperlukan dan menyingkirkan yang tidak diperlukan.</li>
  <li><strong>Rapi:</strong> Menata barang-barang yang diperlukan agar mudah ditemukan dan digunakan kembali.</li>
  <li><strong>Resik:</strong> Membersihkan tempat kerja, lantai, dan peralatan secara berkala untuk menjaga kualitas kerja.</li>
  <li><strong>Rawat:</strong> Mempertahankan standar ringkas, rapi, dan resik agar menjadi kebiasaan tetap yang konsisten.</li>
  <li><strong>Rajin:</strong> Melatih kedisiplinan diri untuk menjalankan aturan 5R secara konsisten setiap hari sebagai budaya kerja.</li>
</ul>
<h2>Menilai Kondisi 5R dengan Checksheet</h2>
<p>Untuk mengukur masalah di lingkungan sekitar, kita dapat menyusun lembar periksa atau <em>checksheet</em> penilaian. Dengan checksheet, siswa dapat membandingkan situasi ideal yang diinginkan dengan situasi saat ini (aktual) untuk mengidentifikasi gap/selisih yang disebut dengan <strong>masalah (problem)</strong>.</p>`,
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
          deskripsi: `<p>Keselamatan kerja (K3) harus selalu menjadi prioritas utama. Di rumah, di jalan, maupun di sekolah, terdapat berbagai potensi bahaya yang mengancam jika kita kurang waspada. Melalui modul ini, kita akan belajar mengidentifikasi risiko guna mencegah terjadinya kecelakaan.</p>
<img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop" alt="Safety and K3" class="rounded-2xl my-6 mx-auto max-w-full h-auto shadow-md border border-neutral-100" />
<h2>STOP 6 Bahaya Utama</h2>
<p>Terdapat 6 jenis potensi bahaya fatal yang harus diwaspadai di tempat kerja maupun area sekolah:</p>
<ol>
  <li><strong>Terjatuh (Slip & Fall):</strong> Akibat lantai licin, tangga tidak aman, atau area kerja basah tanpa tanda peringatan.</li>
  <li><strong>Tersengat Listrik (Electric Shock):</strong> Kabel terkelupas, sirkuit terbuka, atau instalasi listrik di area basah.</li>
  <li><strong>Kebakaran (Fire):</strong> Hubungan arus pendek listrik, kebocoran gas, atau penyimpanan bahan kimia tidak aman.</li>
  <li><strong>Terjepit Peralatan (Apparatus Entanglement):</strong> Bagian mesin berputar tanpa pelindung keselamatan (safety guard).</li>
  <li><strong>Tertimpa Barang Berat (Big Heavy Drop):</strong> Rak penyimpanan yang rapuh, penumpukan berlebih, atau tidak rapi.</li>
  <li><strong>Tertabrak Kendaraan/Alat Angkut (Car/Vehicle Collision):</strong> Lalu lintas area forklift atau kendaraan di jalan umum.</li>
</ol>
<h2>Aktivitas "Duga Bahaya"</h2>
<p>Metode <strong>Duga Bahaya</strong> adalah sarana bertukar pengalaman mengenai peristiwa <em>near-miss</em> (hampir saja celaka). Dengan menduga bahaya sejak dini, kita bisa menganalisis faktor penyebab sebelum kecelakaan fatal benar-benar terjadi.</p>`,
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
          deskripsi: `<p>Kerja bermutu bukan hanya bekerja keras dalam waktu yang lama, melainkan kerja yang secara konsisten menghasilkan **nilai tambah** (value-added). Agar produktivitas meningkat, kita harus mendeteksi dan mengeliminasi 7 jenis pemborosan (waste) yang tidak memberikan nilai tambah bagi proses kerja.</p>
<img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop" alt="Workplace Efficiency" class="rounded-2xl my-6 mx-auto max-w-full h-auto shadow-md border border-neutral-100" />
<h2>7 Jenis Pemborosan (Waste)</h2>
<ul>
  <li><strong>Defect (Kecacatan):</strong> Memproduksi barang cacat yang memerlukan pengerjaan ulang (rework) dan menambah waktu proses.</li>
  <li><strong>Overproduction (Kelebihan Produksi):</strong> Membuat produk melebihi jumlah atau lebih cepat dari yang dibutuhkan.</li>
  <li><strong>Waiting (Waktu Tunggu):</strong> Waktu tunggu kosong akibat antrean proses atau keterlambatan bahan baku.</li>
  <li><strong>Non-utilized Talent (Kurangnya Potensi):</strong> Kurang mendayagunakan ide, keterampilan, dan potensi kreatif karyawan.</li>
  <li><strong>Transportation (Transportasi):</strong> Pemindahan barang atau material yang tidak perlu dan berjarak jauh.</li>
  <li><strong>Inventory (Persediaan Berlebih):</strong> Penumpukan stok barang mentah atau setengah jadi yang mengendap di gudang.</li>
  <li><strong>Motion (Gerakan Tidak Perlu):</strong> Gerakan fisik pekerja yang tidak efisien akibat tata letak kerja buruk.</li>
</ul>`,
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
          deskripsi: `<p>Menjadi seorang <em>Problem Solver</em> sejati membutuhkan metode pemecahan masalah yang sistematis. Di dunia industri dan pendidikan modern, siklus **PDCA (Plan-Do-Check-Action)** dikonkritkan menjadi sistematika 8 langkah perbaikan.</p>
<img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" alt="Problem Solving Meeting" class="rounded-2xl my-6 mx-auto max-w-full h-auto shadow-md border border-neutral-100" />
<h2>Alur 8 Langkah Penyelesaian Masalah (PDCA)</h2>
<ul>
  <li><strong>PLAN (Rencana):</strong>
    <ol>
      <li>Menentukan Tema & Menetapkan Target Perbaikan.</li>
      <li>Memahami Kondisi Aktual & Menganalisis Masalah.</li>
      <li>Menganalisis Akar Penyebab Masalah (Root Cause).</li>
      <li>Merencanakan Penanggulangan (Countermeasures).</li>
    </ol>
  </li>
  <li><strong>DO (Laksanakan):</strong>
    <ol>
      <li>Melaksanakan Rencana Tindakan Penanggulangan.</li>
    </ol>
  </li>
  <li><strong>CHECK (Periksa):</strong>
    <ol>
      <li>Memeriksa & Mengevaluasi Hasil Perbaikan.</li>
    </ol>
  </li>
  <li><strong>ACTION (Tindak Lanjut):</strong>
    <ol>
      <li>Standarisasi Prosedur Baru yang Sukses.</li>
      <li>Menetapkan Rencana Tindak Lanjut Berikutnya.</li>
    </ol>
  </li>
</ul>
<p>Sistematika PDCA ini membantu menyusun dokumen <strong>Proposal Perbaikan</strong> dan <strong>Laporan Perkembangan Proyek Perbaikan</strong> secara ilmiah, terstruktur, dan terukur.</p>`,
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

      // 3. Insert or Update into DB
      for (const m of modules) {
        const existingModul = await this.prisma.modulTeori.findUnique({
          where: { slug: m.slug }
        });

        let createdModul;
        if (existingModul) {
          // Update deskripsi artikel HTML jika modul sudah ada
          createdModul = await this.prisma.modulTeori.update({
            where: { id: existingModul.id },
            data: {
              judul: m.judul,
              deskripsi: m.deskripsi,
              urutan: m.urutan
            }
          });
        } else {
          // Buat baru jika belum ada
          createdModul = await this.prisma.modulTeori.create({
            data: {
              topik_id: topik.id,
              judul: m.judul,
              slug: m.slug,
              deskripsi: m.deskripsi,
              urutan: m.urutan
            }
          });
        }

        // Seeding quiz questions if not present
        const quizCount = await this.prisma.soalLatihan.count({
          where: { modul_teori_id: createdModul.id }
        });

        if (quizCount === 0) {
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
      }
      console.log('Seeding and updating training materials completed successfully!');
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

  private async seedTugasIfEmpty() {
    const hitungTugas = await this.prisma.tugasPraktek.count();
    
    // Jika di database cloud sudah ada datanya, batalkan proses (agar tidak duplikat)
    if (hitungTugas > 0) return;

    console.log('*** Menyuntikkan 5 Master Tugas Praktek N-KGTS ke Cloud Neon... ***');

    const masterTugas = [
      {
        id: 1,
        judul: 'Pengenalan Budaya Kaizen',
        deskripsi: 'Lakukan observasi dan catat contoh penerapan budaya Kaizen di lingkungan Anda.',
        urutan: 1,
      },
      {
        id: 2,
        judul: '5R (Ringkas, Rapi, Resik, Rawat, Rajin)',
        deskripsi: 'Terapkan dan dokumentasikan langkah 5R pada area kerja yang Anda pilih.',
        urutan: 2,
      },
      {
        id: 3,
        judul: '6 Potensi Bahaya',
        deskripsi: 'Identifikasi acronym 6 potensi bahaya di lokasi kerja dan usulkan mitigasinya.',
        urutan: 3,
      },
      {
        id: 4,
        judul: '7 Pemborosan',
        deskripsi: 'Amati contoh pemborosan (muda-mudahan) dan catat cara menguranginya.',
        urutan: 4,
      },
      {
        id: 5,
        judul: '8 Langkah Penyelesaian Masalah',
        deskripsi: 'Praktikkan 8 langkah penyelesaian masalah pada studi kasus sederhana.',
        urutan: 5,
      },
    ];

    for (const tugas of masterTugas) {
      await this.prisma.tugasPraktek.create({ data: tugas });
    }

    console.log('✅ 5 Master Tugas Praktek Berhasil Di-seed!');
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

