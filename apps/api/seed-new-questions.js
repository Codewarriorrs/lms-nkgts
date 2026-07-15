const { PrismaClient } = require('./generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeding Kuis dan Latihan Soal dari docx...');

  // 1. Ambil semua ModulTeori yang terdaftar
  const modules = await prisma.modulTeori.findMany({
    orderBy: { urutan: 'asc' }
  });

  if (modules.length === 0) {
    console.error('Error: Tidak ada ModulTeori ditemukan. Harap jalankan server backend terlebih dahulu untuk inisialisasi modul default.');
    process.exit(1);
  }

  console.log(`Menemukan ${modules.length} modul teori.`);

  // Mapping modul berdasarkan urutan (1 to 5)
  const moduleMap = {};
  modules.forEach(m => {
    moduleMap[m.urutan] = m.id;
  });

  // 2. Data KUIS (SoalLatihan) dari docx
  const kuisData = {
    1: [
      {
        pertanyaan: 'Apa makna yang tepat untuk “Kaizen”?',
        pilihan_a: 'Perubahan Besar',
        pilihan_b: 'Perbaikan Berkelanjutan',
        pilihan_c: 'Inovasi Teknologi',
        pilihan_d: 'Standarisasi Prosedur Kerja',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Budaya Kaizen bermula dimana?',
        pilihan_a: 'Jepang',
        pilihan_b: 'Korea',
        pilihan_c: 'Jerman',
        pilihan_d: 'China',
        jawaban_benar: 0
      },
      {
        pertanyaan: 'Di dalam suatu organisasi, siapa yang dapat melakukan Kaizen?',
        pilihan_a: 'Pihak Management',
        pilihan_b: 'Kepala Department',
        pilihan_c: 'Karyawan',
        pilihan_d: 'Setiap orang yang ada di dalam Organisasi tersebut',
        jawaban_benar: 3
      },
      {
        pertanyaan: 'Kaizen dapat diterapkan dimana?',
        pilihan_a: 'Pekerjaan',
        pilihan_b: 'Sekolah',
        pilihan_c: 'Dimana saja/di kehidupan sehari-hari',
        pilihan_d: 'Rumah Tangga',
        jawaban_benar: 2
      },
      {
        pertanyaan: 'Manakah dari perilaku berikut yang paling mencerminkan budaya Kaizen di lingkungan kerja?',
        pilihan_a: 'Menyembunyikan kesalahan agar tidak dihukum',
        pilihan_b: 'Menunggu instruksi atasan sebelum berubah',
        pilihan_c: 'Karyawan rutin memberikan saran perbaikan',
        pilihan_d: 'Bekerja lembur setiap hari demi target',
        jawaban_benar: 2
      }
    ],
    2: [
      {
        pertanyaan: 'Apa yang dimaksud dengan masalah?',
        pilihan_a: 'Ketegangan situasi/kondisi',
        pilihan_b: 'Selisih/gap kondisi ideal dengan kondisi aktual',
        pilihan_c: 'Perbedaan pendapat',
        pilihan_d: 'Hambatan kerja',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Langkah pertama dalam 5R adalah Ringkas (Seiri) Apa aktivitas utama yang harus dilakukan pada tahap ini?',
        pilihan_a: 'Membuang barang yang tidak diperlukan',
        pilihan_b: 'Membuat jadwal piket kebersihan',
        pilihan_c: 'Menata letak peralatan agar estetik',
        pilihan_d: 'Membersihkan debu di area kerja',
        jawaban_benar: 0
      },
      {
        pertanyaan: 'Dalam metodologi 5R, apa perbedaan utama antara Ringkas dan Rapi?',
        pilihan_a: 'Ringkas berarti mendisiplinkan kebiasaan kerja',
        pilihan_b: 'Ringkas berarti mengatur tata letak alat kerja',
        pilihan_c: 'Rapi berarti membersihkan area kerja dari debu',
        pilihan_d: 'Ringkas berarti membuang barang yang tidak perlu',
        jawaban_benar: 3
      },
      {
        pertanyaan: 'Manakah pernyataan yang paling tepat menggambarkan tahap Rajin (Shitsuke)?',
        pilihan_a: 'Menyelesaikan pekerjaan tepat waktu',
        pilihan_b: 'Menjadikan 5R sebagai budaya kerja',
        pilihan_c: 'Menambah jumlah jam lembur kerja',
        pilihan_d: 'Mengecat ulang dinding pabrik',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Konsep Rapi (Seiton) menekankan pada prinsip ‘satu tempat untuk setiap barang’. Apa tujuan utama dari prinsip ini?',
        pilihan_a: 'Memastikan alat agar tidak cepat rusak',
        pilihan_b: 'Mengurangi biaya pengadaan alat baru',
        pilihan_c: 'Meminimalkan waktu pencarian barang',
        pilihan_d: 'Meningkatkan disiplin diri karyawan',
        jawaban_benar: 2
      }
    ],
    3: [
      {
        pertanyaan: 'Apa yang dimaksud dengan potensi bahaya Apparatus?',
        pilihan_a: 'Tersengat aliran Listrik',
        pilihan_b: 'Tertimpa benda berat',
        pilihan_c: 'Terjepit peralatan kerja',
        pilihan_d: 'Terjatuh dari ketinggian',
        jawaban_benar: 2
      },
      {
        pertanyaan: 'Seorang pekerja hampir saja tertabrak oleh forklift yang melintas di area produksi. Bahaya ini termasuk dalam kategori 6 Potensi Bahaya yang mana?',
        pilihan_a: 'Big',
        pilihan_b: 'Car',
        pilihan_c: 'Apparatus',
        pilihan_d: 'Fire',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Apa tujuan utama dari dilakukannya aktivitas ‘DUGA BAHAYA’ di tempat kerja?',
        pilihan_a: 'Menghitung kerugian finansial Perusahaan',
        pilihan_b: 'Mengganti semua peralatan kerja yang lama',
        pilihan_c: 'Menentukan siapa yang harus disalahkan',
        pilihan_d: 'Mencegah pengulangan kejadian hampir celaka',
        jawaban_benar: 3
      },
      {
        pertanyaan: 'Kejadian lantai licin yang menyebabkan seseorang hampir jatuh namun tidak sampai cedera disebut dengan istilah?',
        pilihan_a: 'Tindakan perbaikan',
        pilihan_b: 'Peristiwa near-miss',
        pilihan_c: 'Kecelakaan fatal',
        pilihan_d: 'Kondisi ideal',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Mengapa penilaian risiko (risk assessment) dianggap penting dalam upaya STOP 6 Bahaya?',
        pilihan_a: 'Menentukan prioritas tindakan perbaikan',
        pilihan_b: 'Meniadakan tugas harian para siswa',
        pilihan_c: 'Memenuhi syarat administrasi sekolah saja',
        pilihan_d: 'Mempercepat waktu penyelesaian pekerjaan',
        jawaban_benar: 0
      }
    ],
    4: [
      {
        pertanyaan: 'Apa yang dimaksud dengan kerja bermutu?',
        pilihan_a: 'Kerja yang menghasilkan nilai tambah berkelanjutan',
        pilihan_b: 'Kerja yang menghabiskan waktu paling lama',
        pilihan_c: 'Kerja yang dilakukan dengan sangat cepat',
        pilihan_d: 'Kerja yang mengikuti perintah atasan saja',
        jawaban_benar: 0
      },
      {
        pertanyaan: 'Seorang siswa harus mencari kunci motor selama 10 menit sebelum berangkat sekolah. Jenis pemborosan apa yang terjadi?',
        pilihan_a: 'Motion',
        pilihan_b: 'Overproduction',
        pilihan_c: 'Inventory',
        pilihan_d: 'Defects',
        jawaban_benar: 0
      },
      {
        pertanyaan: 'Memindahkan buku dari meja satu ke meja lain berkali-kali tanpa alasan yang jelas termasuk pemborosan jenis?',
        pilihan_a: 'Defects',
        pilihan_b: 'Waiting',
        pilihan_c: 'Transportation',
        pilihan_d: 'Over-Processing',
        jawaban_benar: 2
      },
      {
        pertanyaan: 'Manakah yang merupakan contoh \'Over-processing\' pada aktivitas di sekolah?',
        pilihan_a: 'Salah mengerjakan halaman tugas sehingga harus mengulang',
        pilihan_b: 'Menulis ulang catatan yang sudah rapi hanya agar terlihat lebih indah',
        pilihan_c: 'Membawa terlalu banyak buku yang tidak ada jawabannya',
        pilihan_d: 'Datang ke sekolah terlalu pagi saat gerbang masih tutup',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Dalam tabel analisa aktivitas, apa tujuan menuliskan \'Situasi Ideal\'?',
        pilihan_a: 'Sebagai catatan biaya yang telah dikeluarkan',
        pilihan_b: 'Sebagai daftar orang yang bertanggung jawab',
        pilihan_c: 'Sebagai standar atau acuan yang ingin dicapai',
        pilihan_d: 'Sebagai tempat mencatat keluhan harian',
        jawaban_benar: 2
      }
    ],
    5: [
      {
        pertanyaan: 'Apa tujuan utama dari tahap \'Asesmen\' dalam sistematika penyelesaian masalah?',
        pilihan_a: 'Memberi pelatihan',
        pilihan_b: 'Menghafal teori',
        pilihan_c: 'Mengukur kompetensi',
        pilihan_d: 'Membuat proposal',
        jawaban_benar: 2
      },
      {
        pertanyaan: 'Dalam karakter DEKKI, apa yang dimaksud dengan \'E\'?',
        pilihan_a: 'Edukasi',
        pilihan_b: 'Efektif',
        pilihan_c: 'Empati',
        pilihan_d: 'Efisien',
        jawaban_benar: 2
      },
      {
        pertanyaan: 'Dokumen apa yang pertama kali dibuat untuk merencanakan langkah-langkah penyelesaian masalah?',
        pilihan_a: 'Proposal Perbaikan',
        pilihan_b: 'Laporan Proyek',
        pilihan_c: 'Laporan Perkembangan',
        pilihan_d: 'Sertifikat Pelatihan',
        jawaban_benar: 0
      },
      {
        pertanyaan: 'Seorang problem solver yang mampu memberikan ide-ide baru yang belum pernah ada sebelumnya menunjukkan karakter?',
        pilihan_a: 'Kritis',
        pilihan_b: 'Inovatif',
        pilihan_c: 'Empati',
        pilihan_d: 'Disiplin',
        jawaban_benar: 1
      },
      {
        pertanyaan: 'Karakter \'Kritis\' (Critical Thinking) dalam problem solving berguna untuk?',
        pilihan_a: 'Menganalisa masalah',
        pilihan_b: 'Mencari teman',
        pilihan_c: 'Meniru ide orang',
        pilihan_d: 'Datang tepat waktu',
        jawaban_benar: 0
      }
    ]
  };

  // 3. Data LATSOL (LatihanSoal) dari docx
  const latsolData = {
    1: [
      { pertanyaan: 'Kaizen dapat diterapkan dimana?', pilihan: ["Pekerjaan", "Sekolah", "Dimana saja/di kehidupan sehari-hari", "Rumah Tangga"], jawaban_benar: 2 },
      { pertanyaan: 'Manakah dari perilaku berikut yang paling mencerminkan budaya Kaizen di lingkungan kerja?', pilihan: ["Menyembunyikan kesalahan agar tidak dihukum", "Menunggu instruksi atasan sebelum berubah", "Karyawan rutin memberikan saran perbaikan", "Bekerja lembur setiap hari demi target"], jawaban_benar: 2 },
      { pertanyaan: 'Apa makna yang tepat untuk “Kaizen”?', pilihan: ["Perubahan Besar", "Perbaikan Berkelanjutan", "Inovasi Teknologi", "Standarisasi Prosedur Kerja"], jawaban_benar: 1 },
      { pertanyaan: 'Di dalam suatu organisasi, siapa yang dapat melakukan Kaizen?', pilihan: ["Pihak Management", "Kepala Department", "Karyawan", "Setiap orang yang ada di dalam Organisasi tersebut"], jawaban_benar: 3 },
      { pertanyaan: 'Apa perbedaan mendasar antara filosofi Kaizen dengan konsep Inovasi radikal (Kaikaku)?', pilihan: ["Kaizen berfokus pada hasil jangka pendek", "Kaizen bersifat inkremental dan kontinyu", "Kaizen hanya dilakukan oleh pihak manajemen", "Kaizen memerlukan investasi modal besar"], jawaban_benar: 1 },
      { pertanyaan: 'Budaya Kaizen bermula dimana?', pilihan: ["Jepang", "Korea", "Jerman", "China"], jawaban_benar: 0 },
      { pertanyaan: 'Apa peran utama dari SGA (Small Group Discussion) dalam mendukung budaya Kaizen?', pilihan: ["Mengawasi pekerja", "Menyusun anggaran", "Menilai hasil kerja", "Memecahkan masalah"], jawaban_benar: 3 },
      { pertanyaan: 'Penerapan Kaizen di area perkantoran seringkali berfokus pada pengurangan pemborosan informasi. Manakah contoh nyata dari pemborosan tersebut?', pilihan: ["Pengarsipan digital", "Rapat tepat waktu", "Meja kerja bersih", "Email berlebihan"], jawaban_benar: 3 },
      { pertanyaan: 'Konsep apa yang seringkali dipakai di dalam Budaya Kaizen?', pilihan: ["Plan – Do – Check -  Act ( PDCA)", "Work Life Balance", "Kolaborasi", "Upskilling"], jawaban_benar: 0 }
    ],
    2: [
      { pertanyaan: 'Manakah pernyataan yang paling tepat menggambarkan tahap Rajin (Shitsuke)?', pilihan: ["Menyelesaikan pekerjaan tepat waktu", "Menjadikan 5R sebagai budaya kerja", "Menambah jumlah jam lembur kerja", "Mengecat ulang dinding pabrik"], jawaban_benar: 1 },
      { pertanyaan: 'Dalam tahap Rawat (Seiketsu) bertujuan untuk mempertahankan kondisi 3R sebelumnya. Apa elemen kunci dalam keberhasilan tahap ini?', pilihan: ["Standarisasi dan manajemen visual", "Pelatihan motivasi setiap minggu", "Penghitungan jumlah barang hilang", "Adanya hukuman bagi yang tidak melaksanakan 5R"], jawaban_benar: 0 },
      { pertanyaan: 'Konsep Rapi (Seiton) menekankan pada prinsip ‘satu tempat untuk setiap barang’. Apa tujuan utama dari prinsip ini?', pilihan: ["Memastikan alat agar tidak cepat rusak", "Mengurangi biaya pengadaan alat baru", "Meminimalkan waktu pencarian barang", "Meningkatkan disiplin diri karyawan"], jawaban_benar: 2 },
      { pertanyaan: 'Dalam tahap Resik (Seiso), membersihkan tempat kerja bukan sekedar menghilangkan kotoran, melainkan juga berfungsi sebagai', pilihan: ["Kegiatan untuk mengisi waktu luang", "Metode untuk membuang dokumen lama", "Sarana inspeksi kerusakan peralatan", "Cara untuk menyenangkan pimpinan"], jawaban_benar: 2 },
      { pertanyaan: 'Apa yang dimaksud dengan masalah?', pilihan: ["Ketegangan situasi/kondisi", "Selisih/gap kondisi ideal dengan kondisi aktual", "Perbedaan pendapat", "Hambatan kerja"], jawaban_benar: 1 },
      { pertanyaan: 'Jika seorang operator menemukan kebocoran oli saat sedang menyapu lantai, ia telah menerapkan esensi dari tahap?', pilihan: ["Resik", "Rapi", "Ringkas", "Rajin"], jawaban_benar: 0 },
      { pertanyaan: 'Penggunaan Label biasanya diaplikasikan pada tahap mana dalam siklus 5R?', pilihan: ["Resik", "Rapi", "Rawat", "Ringkas"], jawaban_benar: 3 },
      { pertanyaan: 'Apa yang dimaksud dengan ‘Manajemen Visual’ dalam konteks tahap Rawat (Seiketsu)?', pilihan: ["Pemasangan kamera CCTV di kantor", "Pemberian kode warna dan label", "Pembuatan album foto kegiatan karyawan", "Penyediaan monitor TV untuk hiburan"], jawaban_benar: 1 },
      { pertanyaan: 'Dalam metodologi 5R, apa perbedaan utama antara Ringkas dan Rapi?', pilihan: ["Ringkas berarti mendisiplinkan kebiasaan kerja", "Ringkas berarti mengatur tata letak alat kerja", "Rapi berarti membersihkan area kerja dari debu", "Ringkas berarti membuang barang yang tidak perlu"], jawaban_benar: 3 },
      { pertanyaan: 'Langkah pertama dalam 5R adalah Ringkas (Seiri) Apa aktivitas utama yang harus dilakukan pada tahap ini?', pilihan: ["Membuang barang yang tidak diperlukan", "Membuat jadwal piket kebersihan", "Menata letak peralatan agar estetik", "Membersihkan debu di area kerja"], jawaban_benar: 0 }
    ],
    3: [
      { pertanyaan: 'Manakah yang merupakan langkah dalam aktivitas ‘DUGA BAHAYA’ setelah menceritakan kejadian nyaris celaka?', pilihan: ["Segera melanjutkan perkerjaan tanpa diskusi", "Mempublikasikan nama orang yang terlibat", "Mengabaikan faktor lingkungan yang ada", "Menganalisa faktor penyebab situasi bahaya"], jawaban_benar: 3 },
      { pertanyaan: 'Kejadian lantai licin yang menyebabkan seseorang hampir jatuh namun tidak sampai cedera disebut dengan istilah?', pilihan: ["Tindakan perbaikan", "Peristiwa near-miss", "Kecelakaan fatal", "Kondisi ideal"], jawaban_benar: 1 },
      { pertanyaan: 'Apa yang dimaksud dengan potensi bahaya Apparatus?', pilihan: ["Tersengat aliran Listrik", "Tertimpa benda berat", "Terjepit peralatan kerja", "Terjatuh dari ketinggian"], jawaban_benar: 2 },
      { pertanyaan: 'Jika kabel stop kontak di kelas terkelupas, potensi bahaya yang paling relevan adalah?', pilihan: ["Electric", "Car", "Big", "Apparatus"], jawaban_benar: 0 },
      { pertanyaan: 'Seorang siswa mengamati bahwa idealnya kabel di lab komputer harus tertutup rapi, namun faktanya ada kabel yang terkelupas. Selisih ini disebut sebagai?', pilihan: ["Perbaikan", "Masalah", "Konflik", "Solusi"], jawaban_benar: 1 },
      { pertanyaan: 'Seorang pekerja hampir saja tertabrak oleh forklift yang melintas di area produksi. Bahaya ini termasuk dalam kategori 6 Potensi Bahaya yang mana?', pilihan: ["Big", "Car", "Apparatus", "Fire"], jawaban_benar: 1 },
      { pertanyaan: 'Dalam pengisian checksheet keselamatan, apa yang harus dipastikan agar masalah tertulis dengan jelas?', pilihan: ["Terlihat selisih antara kondisi ideal dan actual", "Menggunakan Bahasa teknis yang sangat rumit", "Hanya menuliskan keluhan pribadi saja", "Menyembunyikan fakta lapangan yang buruk"], jawaban_benar: 0 },
      { pertanyaan: 'Potensi bahaya berupa tertimpa rak gudang yang roboh atau kejatuhan alat dari lantai atas termasuk dalam kategori?', pilihan: ["Fire", "Electric", "Big/heavy", "Drop"], jawaban_benar: 2 },
      { pertanyaan: 'Mengapa penilaian risiko (risk assessment) dianggap penting dalam upaya STOP 6 Bahaya?', pilihan: ["Menentukan prioritas tindakan perbaikan", "Meniadakan tugas harian para siswa", "Memenuhi syarat administrasi sekolah saja", "Mempercepat waktu penyelesaian pekerjaan"], jawaban_benar: 0 },
      { pertanyaan: 'Apa tujuan utama dari dilakukannya aktivitas ‘DUGA BAHAYA’ di tempat kerja?', pilihan: ["Menghitung kerugian finansial Perusahaan", "Mengganti semua peralatan kerja yang lama", "Menentukan siapa yang harus disalahkan", "Mencegah pengulangan kejadian hampir celaka"], jawaban_benar: 3 }
    ],
    4: [
      { pertanyaan: 'Apa dampak utama jika kita tidak \'Sadar Masalah\' (Problem Awareness)?', pilihan: ["Pekerjaan menjadi selesai lebih cepat", "Waktu istirahat akan menjadi lebih lama", "Kita akan mendapatkan banyak pujian", "Pemborosan akan terus terjadi dan dianggap normal"], jawaban_benar: 3 },
      { pertanyaan: 'Apa yang dimaksud dengan kerja bermutu?', pilihan: ["Kerja yang menghasilkan nilai tambah secara berkelanjutan", "Kerja yang menghabiskan waktu paling lama", "Kerja yang dilakukan dengan sangat cepat", "Kerja yang mengikuti perintah atasan saja"], jawaban_benar: 0 },
      { pertanyaan: 'Dalam tabel analisa aktivitas, apa tujuan menuliskan \'Situasi Ideal\'?', pilihan: ["Sebagai catatan biaya yang telah dikeluarkan", "Sebagai daftar orang yang bertanggung jawab", "Sebagai standar atau acuan yang ingin dicapai", "Sebagai tempat mencatat keluhan harian"], jawaban_benar: 2 },
      { pertanyaan: 'Bagaimana cara menuliskan masalah dengan jelas di tabel tugas?', pilihan: ["Menyalahkan pihak lain atas terjadinya pemborosan", "Menuliskan penyebab masalah secara panjang lebar", "Menunjukkan dengan gamblang selisih antara kondisi ideal dan aktual", "Menggunakan Bahasa kiasan agar lebih sopan"], jawaban_benar: 2 },
      { pertanyaan: 'Siswa yang mengantri sangat lama di kantin sekolah mengalami pemborosan jenis?', pilihan: ["Waiting", "Overproduction", "Inventory", "Motion"], jawaban_benar: 0 },
      { pertanyaan: 'Seorang siswa harus mencari kunci motor selama 10 menit sebelum berangkat sekolah. Jenis pemborosan apa yang terjadi?', pilihan: ["Motion", "Overproduction", "Inventory", "Defects"], jawaban_benar: 0 },
      { pertanyaan: 'Pemborosan \'Inventory\' di rumah bisa dicontohkan dengan?', pilihan: ["Lupa mematikan keran air", "Berjalan bolak-balik dari dapur ke meja makan", "Membiarkan lampu menyala di siang hari", "Menumpuk baju lama di lemari yang sudah tidak pernah dipakai"], jawaban_benar: 3 },
      { pertanyaan: 'Manakah yang merupakan contoh \'Over-processing\' pada aktivitas di sekolah?', pilihan: ["Salah mengerjakan halaman tugas sehingga harus mengulang", "Menulis ulang catatan yang sudah rapi hanya agar terlihat lebih indah", "Membawa terlalu banyak buku yang tidak ada jawabannya", "Datang ke sekolah terlalu pagi saat gerbang masih tutup"], jawaban_benar: 1 },
      { pertanyaan: 'Jika Situasi Ideal adalah \'Sampai di sekolah jam 06.45\' dan Kondisi Aktual adalah \'Sampai jam 07.15\', maka berapa besar masalahnya?', pilihan: ["Sampai tepat waktu", "Terlambat 30 menit", "Tidak ada masalah sama sekali", "Datang lebih awal 15 menit"], jawaban_benar: 1 },
      { pertanyaan: 'Memindahkan buku dari meja satu ke meja lain berkali-kali tanpa alasan yang jelas termasuk pemborosan jenis?', pilihan: ["Defects", "Waiting", "Transportation", "Over-Processing"], jawaban_benar: 2 }
    ],
    5: [
      { pertanyaan: 'Mana yang merupakan hasil akhir yang diharapkan dari sistematika ini?', pilihan: ["Koleksi foto perbaikan", "Sikap kritis tanpa Solusi", "Problem Solver yang kompeten", "Hanya tumpukan dokumen"], jawaban_benar: 2 },
      { pertanyaan: 'Seorang problem solver yang mampu memberikan ide-ide baru yang belum pernah ada sebelumnya menunjukkan karakter?', pilihan: ["Kritis", "Inovatif", "Empati", "Disiplin"], jawaban_benar: 1 },
      { pertanyaan: 'Kemampuan untuk menyampaikan hasil perbaikan kepada orang lain disebut sebagai?', pilihan: ["Technical Skill", "Creative Thinking", "Communication Skill", "Critical Thinking"], jawaban_benar: 2 },
      { pertanyaan: 'Karakter \'Kritis\' (Critical Thinking) dalam problem solving berguna untuk?', pilihan: ["Menganalisa masalah", "Mencari teman", "Meniru ide orang", "Datang tepat waktu"], jawaban_benar: 0 },
      { pertanyaan: 'Apa tujuan utama dari tahap \'Asesmen\' dalam sistematika penyelesaian masalah?', pilihan: ["Memberi pelatihan", "Menghafal teori", "Mengukur kompetensi", "Membuat proposal"], jawaban_benar: 2 },
      { pertanyaan: 'Apa yang termasuk isi dari format \'Laporan Perkembangan Perbaikan\'?', pilihan: ["Daftar hadir", "Biodata Peserta", "Judul Proyek saja", "Progres Pelaksanaan"], jawaban_benar: 3 },
      { pertanyaan: 'Metode utama yang digunakan dalam 8 langkah perbaikan pada tahap \'Praktek\' adalah', pilihan: ["SWOT", "PDCA", "KAIZEN", "SMART"], jawaban_benar: 1 },
      { pertanyaan: 'Alur penyelesaian masalah menurut materi terdiri dari tiga tahap besar, yaitu', pilihan: ["Praktek – Pelatihan – Asesmen", "Pelatihan – Praktek – Asesmen", "Asesmen – Pelatihan – Praktek", "Input – Proses – Output"], jawaban_benar: 1 },
      { pertanyaan: 'Dokumen apa yang pertama kali dibuat untuk merencanakan langkah-langkah penyelesaian masalah?', pilihan: ["Proposal Perbaikan", "Laporan Proyek", "Laporan Perkembangan", "Sertifikat Pelatihan"], jawaban_benar: 0 },
      { pertanyaan: 'Dalam karakter DEKKI, apa yang dimaksud dengan \'E\'?', pilihan: ["Edukasi", "Efektif", "Empati", "Efisien"], jawaban_benar: 2 }
    ]
  };

  try {
    // 4. Bersihkan data kuis (SoalLatihan) dan latsol (LatihanSoal) lama
    console.log('Membersihkan data kuis (SoalLatihan) lama...');
    await prisma.soalLatihan.deleteMany();

    console.log('Membersihkan data latsol (LatihanSoal) lama...');
    await prisma.latihanSoal.deleteMany();

    // 5. Masukkan KUIS (SoalLatihan)
    for (const urutan of Object.keys(kuisData)) {
      const moduleId = moduleMap[urutan];
      if (!moduleId) {
        console.warn(`Modul dengan urutan ${urutan} tidak ditemukan, melompati kuis.`);
        continue;
      }
      console.log(`Mengisi Kuis untuk Modul ${urutan}...`);
      for (const item of kuisData[urutan]) {
        await prisma.soalLatihan.create({
          data: {
            modul_teori_id: moduleId,
            pertanyaan: item.pertanyaan,
            pilihan_a: item.pilihan_a,
            pilihan_b: item.pilihan_b,
            pilihan_c: item.pilihan_c,
            pilihan_d: item.pilihan_d,
            jawaban_benar: item.jawaban_benar
          }
        });
      }
    }

    // 6. Masukkan LATSOL (LatihanSoal)
    for (const urutan of Object.keys(latsolData)) {
      const moduleId = moduleMap[urutan];
      if (!moduleId) {
        console.warn(`Modul dengan urutan ${urutan} tidak ditemukan, melompati latsol.`);
        continue;
      }
      console.log(`Mengisi Latsol untuk Modul ${urutan}...`);
      for (const item of latsolData[urutan]) {
        await prisma.latihanSoal.create({
          data: {
            modul_teori_id: moduleId,
            pertanyaan: item.pertanyaan,
            pilihan: item.pilihan,
            jawaban_benar: item.jawaban_benar,
            poin: 10
          }
        });
      }
    }

    console.log('Seeding kuis dan latsol dari docx BERHASIL!');
  } catch (error) {
    console.error('Error saat seeding kuis/latsol:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
