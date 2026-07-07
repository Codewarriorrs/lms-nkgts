export interface MateriSection {
  title: string;
  paragraphs: string[];
}

export interface MateriModule {
  id: number;
  slug: string;
  title: string;
  topic: string;
  duration: string;
  description: string;
  sections: MateriSection[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
  }[];
}

const materiModules: MateriModule[] = [
  {
    "id": 1,
    "slug": "pengenalan-kaizen",
    "title": "Pengenalan Budaya Kaizen",
    "topic": "Modul 1",
    "duration": "45 menit",
    "description": "Memahami fondasi Kaizen, sejarah, pelaku, dan pentingnya budaya perbaikan berkelanjutan di sekolah dan industri.",
    "quiz": [
      {
        "question": "Kaizen berasal dari bahasa Jepang yang bermakna...",
        "options": [
          "Perubahan Instan",
          "Perubahan Baik / Perbaikan Berkelanjutan",
          "Efisiensi Biaya",
          "Produksi Massal"
        ],
        "correct": 1
      },
      {
        "question": "Salah satu pilar penting Kaizen (TPS) dikembangkan oleh Toyota antara tahun...",
        "options": [
          "1930-an",
          "1950-an",
          "1960-an s/d 1970-an",
          "1990-an"
        ],
        "correct": 2
      },
      {
        "question": "Siapa yang perlu melakukan Kaizen dalam suatu organisasi/sekolah?",
        "options": [
          "Pimpinan puncak saja",
          "Karyawan tingkat bawah saja",
          "Hanya kepala bagian",
          "Semua orang dalam organisasi/sekolah"
        ],
        "correct": 3
      }
    ],
    "sections": [
      {
        "title": "Slide 1: PENGENALAN BUDAYA KAIZEN",
        "paragraphs": [
          "(Kaizen Culture)"
        ]
      },
      {
        "title": "Slide 2: Apa itu Kaizen?",
        "paragraphs": [
          "DAFTAR ISI",
          "Sejarah Kaizen",
          "Ada apa di Kaizen?",
          "Siapa yang perlu Kaizen?",
          "Kenapa Siswa Perlu Belajar Budaya Kaizen ?",
          "Budaya Kaizen di Sekolah"
        ]
      },
      {
        "title": "Slide 3",
        "paragraphs": [
          "Kaizen adalah istilah dalam Bahasa Jepang yang bermakna \"Perubahan",
          "Baik\", \"Berubah Lebih Baik\", \"Perbaikan Berkelanjutan\".",
          "Bukan soal seberapa besar, lebih tepatnya soal secara konstan menemukan",
          "jalan untuk menjadi lebih baik, lebih efisien, dan minim pemborosan",
          "Awal, Kaizen hanya digunakan di bidang bisnis, tetapi sekarang bisa",
          "diimplementasikan di berbagai bidang seperti:",
          "APA ITU KAIZEN?",
          "Kehidupan Pribadi",
          "Rumah Tangga",
          "Kehidupan Sosial",
          "Pekerjaan"
        ]
      },
      {
        "title": "Slide 4",
        "paragraphs": [
          "Akar Kaizen bermula di Jepang pasca Perang Dunia II (World War II)",
          "The Toyota Production System (TPS): Dikembangkan antara tahun 1960-an",
          "dan 70-an, TPS menjadi pondasi Kaizen, menekankan pengurangan",
          "pemborosan, produksi tepat waktu, dan alur berkelanjutan.",
          "Implementasi Pertama Toyota Menerapkan bentuk awal dari Quality Control",
          "dan Program Saran Karyawan di tahun 1930-an",
          "SEJARAH KAIZEN?"
        ]
      },
      {
        "title": "Slide 5",
        "paragraphs": [
          "Setiap orang dalam organisasi selain menjalankan kegiatan operasional",
          "mereka juga melakukan kaizen",
          "SIAPA YANG MELAKUKAN KAIZEN?",
          "Pimpinan Puncak",
          "Pimpinan Menengah",
          "Kepala Bagian",
          "Karyawan"
        ]
      },
      {
        "title": "Slide 6",
        "paragraphs": [
          "Perubahan kecil tetapi banyak itu lebih baik dari satu pengembangan",
          "besar",
          "Mengambil ide-ide yang berasal dari warga organisasi itu sendiri",
          "ADA APA DI KAIZEN?",
          "Tidak perlu modal investasi yang besar",
          "Membantu dalam memperbaiki kondisi sekarang menuju kondisi yang",
          "diharapkan di masa depan",
          "Mendorong orang untuk bertanggung jawab atas pekerjaan mereka sendiri"
        ]
      },
      {
        "title": "Slide 7: 1.Keluarga Mengurangi Sampah Makanan dan Menghemat Uang:",
        "paragraphs": [
          "Challenge : Makanan terbuang karena perencanaan yang buruk dan akhirnya",
          "membusuk. Kaizen Solution: Menerapkan perencanaan makan, mengadopsi",
          "teknik penyimpanan yang tepat, dan menciptakan sistem lemari es \"habis",
          "digunakan\". Result: Pengurangan 70% dalam pemborosan makanan dan",
          "penghematan uang belanjaan.",
          "CONTOH PENERAPAN KAIZEN"
        ]
      },
      {
        "title": "Slide 8: 2.  Rumah Sakit Memperlancar Alur Ruang Gawat Darurat:",
        "paragraphs": [
          "Challenge: Ruang gawat darurat menghadapi waktu tunggu yang lama dan",
          "kepadatan pasien. Kaizen Solution: Perubahan seperti membuat area khusus",
          "memilah jenis penanganan dan menyederhanakan proses dokumentasi. Result:",
          "Pengurangan 20% dalam waktu tunggu rata-rata dan peningkatan kepuasan",
          "pasien.",
          "CONTOH PENERAPAN KAIZEN"
        ]
      },
      {
        "title": "Slide 9",
        "paragraphs": [
          "Hard Skill dan Soft Skill merupakah persyaratan wajib dalam memasuki",
          "Dunia Usaha dan Dunia Industri",
          "KENAPA SISWA PERLU BELAJAR BUDAYA KAIZEN?",
          "Para siswa lulusan sekolah saat memasuki Dunia Usaha dan Dunia Industri",
          "harus mampu melakukan perbaikan untuk menjaga daya saing produk dan",
          "layanan yang mereka sediakan untuk konsumen.",
          "SMA/SMK",
          "Kuliah",
          "Kerja",
          "Kerja",
          "Perubahan perilaku konsumen"
        ]
      },
      {
        "title": "Slide 10: BUDAYA KAIZEN DI SEKOLAH",
        "paragraphs": [
          "Budaya kaizen di sekolah sebagai pengenalan budaya industri sekaligus",
          "membangun kebiasaan warga sekolah dalam meningkatan mutu kehidupan",
          "melalui perbaikan berkelanjutan",
          "-   Soft Skill",
          "NATIONAL KAIZEN GOES TO SCHOOL"
        ]
      },
      {
        "title": "Slide 11: TERIMA KASIH",
        "paragraphs": []
      }
    ]
  },
  {
    "id": 2,
    "slug": "5r",
    "title": "Budaya Kerja 5R (Ringkas, Rapi, Resik, Rawat, Rajin)",
    "topic": "Modul 2",
    "duration": "50 menit",
    "description": "Belajar mendeteksi masalah di sekitar tempat kerja menggunakan prinsip 5R dan lembar periksa (checksheet).",
    "quiz": [
      {
        "question": "Menurut Taiichi Ohno, masalah terbesar dalam pekerjaan adalah...",
        "options": [
          "Memiliki banyak kompetitor",
          "Tidak memiliki masalah (mengaku tidak ada masalah)",
          "Biaya produksi yang mahal",
          "Kurangnya tenaga kerja"
        ],
        "correct": 1
      },
      {
        "question": "Situasi ideal yang diinginkan dikurangi situasi saat ini (aktual) disebut...",
        "options": [
          "Solusi",
          "Pencapaian",
          "Target",
          "Masalah (Problem)"
        ],
        "correct": 3
      },
      {
        "question": "Alat bantu visual yang biasa digunakan untuk menilai kondisi 5R di tempat kerja adalah...",
        "options": [
          "Checksheet",
          "Struktur Organisasi",
          "Buku Panduan",
          "Laporan Keuangan"
        ],
        "correct": 0
      }
    ],
    "sections": [
      {
        "title": "Slide 1: SADAR MASALAH DI SEKITAR KITA",
        "paragraphs": [
          "(Problem Awarness) 5R"
        ]
      },
      {
        "title": "Slide 2: Apa itu \"Masalah\"?",
        "paragraphs": [
          "Bagaimana menyelesaikan masalah",
          "Bagaimana mengetahui kalau ada masalah?",
          "Masalah di sekitar kita (tempat kerja, keselamatan kerja, mutu kerja)",
          "DAFTAR ISI"
        ]
      },
      {
        "title": "Slide 3",
        "paragraphs": [
          "Masalah adalah telur emas untuk Perbaikan & Inovasi dalam Cara Bisnis",
          "Kita Masalah bukanlah suatu kata yang negatif",
          "\"Tidak ada orang yang memiliki lebih banyak masalah daripada orang yang",
          "mengaku tidak memiliki masalah.\" (Tidak memiliki masalah adalah masalah",
          "terbesar dari semuanya.) -Taiichi Ohno (Japan)-",
          "APA ITU \"MASALAH\"?",
          "Situasi Ideal Yang Diinginkan",
          "Situasi Saat Ini (Kondisi Aktual)",
          "Selisih = Problem"
        ]
      },
      {
        "title": "Slide 4: Situasi Ideal Yang Diinginkan",
        "paragraphs": [
          "Situasi Saat Ini (Kondisi Aktual)",
          "Selisih = Problem",
          "Lihat",
          "langsung",
          "ke",
          "lokasi",
          "dan",
          "deskrisikan bagaimana kondisinya saat ini ? Ukur, ambil datanya dan",
          "tuliskan kondisi aktualnya !",
          "Tuliskan selisihnya!",
          "Tanyakan pada dirimu apa situasi ideal yang diinginkan ? Tuliskan",
          "situasi ideal secara terukur !",
          "BAGAIMANA MENGETAHUI KALAU ADA MASALAH?"
        ]
      },
      {
        "title": "Slide 5: 2.",
        "paragraphs": [
          "3.",
          "4.",
          "5.",
          "Persiapan berangkat sekolah",
          "Masalah di Sekitar Kita"
        ]
      },
      {
        "title": "Slide 6",
        "paragraphs": [
          "Masalah terkait dengan kondisi tempat kerja, biasanya dinilai dengan",
          "kondisi 5R nya. Adapun 5R yang dimaksud adalah sebagai berikut :",
          "MASALAH DI TEMPAT KERJA KITA"
        ]
      },
      {
        "title": "Slide 7: MASALAH DI TEMPAT KERJA KITA",
        "paragraphs": [
          "Apa masalahnya?"
        ]
      },
      {
        "title": "Slide 8: MASALAH DI TEMPAT KERJA KITA",
        "paragraphs": [
          "Lihat dan hitung datanya!"
        ]
      },
      {
        "title": "Slide 9: MASALAH DI TEMPAT KERJA KITA",
        "paragraphs": [
          "Ada lebih dari10 barang yang ditempatkan tidak pada tempatnya"
        ]
      },
      {
        "title": "Slide 10: MASALAH DI TEMPAT KERJA KITA",
        "paragraphs": [
          "Salah satu cara mengukurmasalahditempatkerjakitaadalahdenganmembuat",
          "checksheet, contohnya sebagai berikut :",
          "10",
          "1"
        ]
      },
      {
        "title": "Slide 11: MASALAH DI TEMPAT KERJA",
        "paragraphs": [
          "Mengukur masalah",
          "Situasi Saat Ini (Kondisi Aktual)",
          "Situasi Ideal Yang Diinginkan",
          "Tugas 1 : Menuliskan masalah yang ada di tempat kerja kita dengan cara",
          "menilai kondisi 5R",
          "Pastikan masalah ditulis dengan jelas dan terlihat jelas selisih antara",
          "situasi ideal dan situasi saat ini",
          "Selisih = Problem"
        ]
      },
      {
        "title": "Slide 12: MASALAH DI TEMPAT KERJA",
        "paragraphs": [
          "Membuat Check Sheet",
          "Siswa bisa menggunakan checksheet ini untuk menilai kondisi 5R atau",
          "membuat checksheet sendiri yang disesuaikan dengan kebutuhan penilaian",
          "5R :"
        ]
      }
    ]
  },
  {
    "id": 3,
    "slug": "6-potensi-bahaya",
    "title": "K3: Identifikasi 6 Potensi Bahaya",
    "topic": "Modul 3",
    "duration": "40 menit",
    "description": "Menganalisis potensi kecelakaan kerja di rumah, sekolah, dan perjalanan menggunakan aktivitas Duga Bahaya.",
    "quiz": [
      {
        "question": "Berikut ini termasuk dalam 6 Potensi Bahaya Keselamatan Kerja, kecuali...",
        "options": [
          "Tersengat listrik",
          "Terjatuh",
          "Terlambat bangun tidur",
          "Tertimpa barang dari ketinggian"
        ],
        "correct": 2
      },
      {
        "question": "Aktivitas bertukar pengalaman mengenai peristiwa 'near-miss' (hampir celaka) disebut...",
        "options": [
          "Duga Bahaya",
          "Audit Kerja",
          "Evaluasi Kinerja",
          "Rapat Koordinasi"
        ],
        "correct": 0
      },
      {
        "question": "Tujuan utama dari menilai risiko bahaya di sekolah/tempat kerja adalah...",
        "options": [
          "Menghitung kerugian finansial",
          "Mencari kambing hitam",
          "Menentukan prioritas perbaikan (STOP 6 Bahaya)",
          "Membuat aturan yang ketat"
        ],
        "correct": 2
      }
    ],
    "sections": [
      {
        "title": "Slide 1: SADAR MASALAH DI SEKITAR KITA",
        "paragraphs": [
          "(Problem Awarness) 6 Potensi Bahaya"
        ]
      },
      {
        "title": "Slide 2: Terjatuh",
        "paragraphs": [
          "Tersengat Listrik",
          "Kebakaran",
          "Potensi Kecelakaan Kerja",
          "Potensi terjepit peralatan kerja",
          "Tertimpa barang berat dari ketinggian",
          "Ketrabrak alat angkut atau kendaraan",
          "A",
          "D",
          "B",
          "E",
          "F",
          "C",
          "MASALAH KESELAMATAN KERJA",
          "pparatus",
          "ig Heavy",
          "ar",
          "rop",
          "lectric",
          "ire",
          "2.",
          "3.",
          "4.",
          "5.",
          "6."
        ]
      },
      {
        "title": "Slide 3: 2.",
        "paragraphs": [
          "3.",
          "4.",
          "Potensi bahaya kecelakaannya di mana?",
          "Persiapan berangkat sekolah",
          "Temukan 6 jenis potensi",
          "bahaya yang ada di sekitar",
          "kita di rumah, dijalan dan",
          "disekolah",
          "Masalah di Sekitar Kita",
          "MASALAH KESELAMATAN KERJA"
        ]
      },
      {
        "title": "Slide 4",
        "paragraphs": [
          "Bertukar pengalaman \"NYARIS\" terjadi kecelakaan, \"apa kejadianya ?\",",
          "\"kapan ?\", \"dimana lokasinya ?\"",
          "MASALAH KESELAMATAN KERJA",
          "Aktivitas \"DUGA BAHAYA\" : Pada aktivitas \"DUGA BAHAYA\", • orang-orang",
          "bertukar pengalaman mengenai peristiwa\"near-miss\" (hampir saja) yang",
          "mereka alami selama bekerja sehari-hari. • mereka saling menceritakan",
          "bagaimana kejadian tersebut terjadi, guna mencegah agar kejadian",
          "tersebut tidak terulang kembali. • kemudian mereka akan menganalisa",
          "faktor-faktor yang mengarah pada situasi yang berbahaya tersebut dan, •",
          "mengambil tindakan yang tepat untuk menciptakan tempat kerja yang lebih",
          "aman."
        ]
      },
      {
        "title": "Slide 5",
        "paragraphs": [
          "Menilai risiko bahaya adalah salah satu yang harus dilakukan agar kita",
          "bisa menilai prioritas untuk dilakukan perbaikan, supaya bisa STOP 6",
          "BAHAYA",
          "MASALAH KESELAMATAN KERJA"
        ]
      },
      {
        "title": "Slide 6: MASALAH KESELAMATAN KERJA",
        "paragraphs": [
          "Hampir jatuh, karena lantai licin",
          "5",
          "4",
          "20",
          "Toilet dekat kelas",
          "CONTOH : Pengalaman saya tadi pagi jam 07.00, hampir terjatuh di toilet",
          "sekolah yang dekat kelas 10, karena lantai licin.."
        ]
      },
      {
        "title": "Slide 7: MASALAH DI TEMPAT KERJA",
        "paragraphs": [
          "Mengukur masalah",
          "Situasi Ideal Yang Diinginkan",
          "Situasi Saat Ini (Kondisi Aktual)",
          "Tugas 2 : Menuliskan masalah keselamatan kerja di rumah, disekolah dan",
          "diperjalanan",
          "Pastikan masalah ditulis dengan jelas dan terlihat jelas selisih antara",
          "situasi ideal dan situasi saat ini",
          "Selisih = Problem"
        ]
      },
      {
        "title": "Slide 8: MASALAH KESELAMATAN KERJA",
        "paragraphs": [
          "Siswa bisa menggunakan checksheet ini untuk menilai kondisi keselamatan",
          "kerja atau membuat checksheet sendiri yang disesuaikan dengan penilaian",
          "keselamatan kerja di sekolah :"
        ]
      }
    ]
  },
  {
    "id": 4,
    "slug": "7-pemborosan",
    "title": "Identifikasi 7 Pemborosan (Waste)",
    "topic": "Modul 4",
    "duration": "45 menit",
    "description": "Mendeteksi pemborosan yang tidak memberikan nilai tambah di lingkungan sekitar.",
    "quiz": [
      {
        "question": "Kerja bermutu adalah kerja yang menghasilkan...",
        "options": [
          "Laba yang besar saja",
          "Nilai tambah secara berkelanjutan",
          "Produk dalam jumlah banyak",
          "Waktu kerja yang lama"
        ],
        "correct": 1
      },
      {
        "question": "Menemukan pemborosan bertujuan untuk mengidentifikasi aktivitas yang...",
        "options": [
          "Meningkatkan harga jual",
          "Mempersingkat jam kerja",
          "Tidak memberikan nilai tambah (non-value added)",
          "Menyenangkan karyawan"
        ],
        "correct": 2
      },
      {
        "question": "Salah satu contoh pemborosan di sekitar rumah/sekolah adalah...",
        "options": [
          "Menulis rencana belajar",
          "Menaruh barang sesuai tempatnya",
          "Gerakan/proses bolak-balik yang tidak perlu",
          "Membaca buku materi"
        ],
        "correct": 2
      }
    ],
    "sections": [
      {
        "title": "Slide 1: SADAR MASALAH DI SEKITAR KITA",
        "paragraphs": [
          "(Problem Awarness) 7 Pemborosan"
        ]
      },
      {
        "title": "Slide 2: MASALAH MUTU KERJA",
        "paragraphs": [
          "Kerja bermutu adalah kerja yang menghasilkan nilai tambah secara",
          "berkelanjutan",
          "\\*) Komponen Kerja",
          "Temukan pemborosan-pemborosan dikerja kita! 7 Jenis Pemborosan + 1"
        ]
      },
      {
        "title": "Slide 3: 2.",
        "paragraphs": [
          "3.",
          "4.",
          "5.",
          "Persiapan berangkat sekolah",
          "Masalah di Sekitar Kita",
          "Pemborosannya ada dimana?"
        ]
      },
      {
        "title": "Slide 4: MASALAH MUTU KERJA",
        "paragraphs": [
          "CONTOH ;",
          "ANALISA AKTIVITASDANTIPEPEMBOROSAN",
          "Menemukan pemborosan pada aktivitas di rumah"
        ]
      },
      {
        "title": "Slide 5: MASALAH MUTU",
        "paragraphs": [
          "KERJA",
          "Mengukur masalah",
          "Situasi Ideal Yang Diinginkan",
          "Situasi Saat Ini (Kondisi Aktual)",
          "Tugas 3 : Menuliskan masalah pemborosan di rumah, disekolah dan",
          "diperjalanan",
          "Pastikan masalah ditulis dengan jelas dan terlihat jelas selisih antara",
          "situasi ideal dan situasi saat ini",
          "Selisih = Problem"
        ]
      },
      {
        "title": "Slide 6: MASALAH MUTU KERJA",
        "paragraphs": [
          "Siswa bisa menggunakan table berikut ini untuk menilai pemborosan",
          "disekitar kita baik di rumah, disekolah dan diperjalan",
          "ANALISA AKTIVITAS DAN TIPE PEMBOROSAN"
        ]
      },
      {
        "title": "Slide 7: TERIMA KASIH",
        "paragraphs": []
      }
    ]
  },
  {
    "id": 5,
    "slug": "8-langkah-penyelesaian-masalah",
    "title": "Sistematika 8 Langkah Penyelesaian Masalah",
    "topic": "Modul 5",
    "duration": "60 menit",
    "description": "Menguasai siklus PDCA dan metodologi 8 langkah pemecahan masalah untuk menyusun proposal perbaikan.",
    "quiz": [
      {
        "question": "Siklus utama dalam sistematika penyelesaian masalah adalah...",
        "options": [
          "SDCA",
          "PDCA (Plan-Do-Check-Action)",
          "KPI",
          "FIFO"
        ],
        "correct": 1
      },
      {
        "question": "Dua format dokumen utama yang biasa digunakan dalam proyek perbaikan adalah...",
        "options": [
          "Daftar Hadir & Absensi",
          "Proposal Perbaikan & Laporan Perkembangan Perbaikan",
          "Kuitansi & Nota Belanja",
          "CV & Lamaran Kerja"
        ],
        "correct": 1
      },
      {
        "question": "Karakter utama seorang 'Problem Solver' adalah...",
        "options": [
          "Menghindari masalah",
          "Menyalahkan keadaan",
          "Peduli, sadar masalah, dan aktif melakukan perbaikan",
          "Menunggu instruksi pimpinan saja"
        ],
        "correct": 2
      }
    ],
    "sections": [
      {
        "title": "Slide 1: SISTEMATIKA PENYELESAIAN MASALAH",
        "paragraphs": [
          "(Problem Solving) 8 Langkah Penyelesaian Masalah"
        ]
      },
      {
        "title": "Slide 2: Apa yang dilakukan?",
        "paragraphs": [
          "DAFTAR ISI",
          "Karakter seorang \"Problem Solver\"?",
          "Sistematika Penyelesaian Masalah (Proposal Perbaikan, Laporan Proyek",
          "Perbaikan)"
        ]
      },
      {
        "title": "Slide 3: APA YANG DILAKUKAN ?",
        "paragraphs": [
          "PELATIHAN",
          "PRAKTEK",
          "ASESMEN",
          "Pelatihan dalam kelas PDCA - 8 langkah perbaikan",
          "Praktek langsung menyelesaikan masalah disekitar kita",
          "Mengukur kompetensi dalam menyelesaikan masalah",
          "(Dalam menyelesaikan masalah)"
        ]
      },
      {
        "title": "Slide 4: KETRAMPILAN DAN KARAKTER SEORANG \"PROBLEM SOLVER\"",
        "paragraphs": []
      },
      {
        "title": "Slide 5: SISTEMATIKA PENYELESAIAN MASALAH",
        "paragraphs": [
          "SKILL KOMUNIKASI",
          "SKILL 8 LANGKAH PENYELESAIAN MASALAH",
          "KARAKTER"
        ]
      },
      {
        "title": "Slide 6: 8 LANGKAH PENYELESAIAN MASALAH",
        "paragraphs": [
          "ALUR PENYELESAIAN MASALAH"
        ]
      },
      {
        "title": "Slide 7: CONTOH FORMAT : PROPOSAL PERBAIKAN",
        "paragraphs": []
      },
      {
        "title": "Slide 8: LANGKAH PENYELESAIAN MASALAH",
        "paragraphs": [
          "ALUR PENYELESAIAN MASALAH - PELAKSANAAN"
        ]
      },
      {
        "title": "Slide 9: CONTOH FORMAT : LAPORAN PERKEMBANGAN PERBAIKAN",
        "paragraphs": []
      },
      {
        "title": "Slide 10: TERIMA KASIH",
        "paragraphs": []
      }
    ]
  }
];

export default materiModules;
