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
    id: 1,
    slug: "pengenalan-kaizen",
    title: "Pengenalan Metodologi Kaizen",
    topic: "Modul 1",
    duration: "45 menit",
    description:
      "Memahami fondasi Kaizen, budaya perbaikan berkelanjutan, dan cara mengidentifikasi masalah secara sistematis.",
    sections: [
      {
        title: "Apa itu Kaizen?",
        paragraphs: [
          "Kaizen adalah pendekatan perbaikan berkelanjutan yang menekankan perubahan kecil namun konsisten. Tujuannya adalah mengurangi pemborosan, meningkatkan kualitas secara bertahap, dan menciptakan budaya kerja yang aktif memperbaiki proses.",
          "Dalam dunia industri, Kaizen sering diterapkan untuk meminimalkan waste, mempercepat alur kerja, dan menumbuhkan rasa tanggung jawab bersama di setiap lini kerja.",
        ],
      },
      {
        title: "Prinsip dasar",
        paragraphs: [
          "Prinsip inti Kaizen adalah melihat masalah sebagai peluang perbaikan, bukan kesalahan individu. Perbaikan yang dilakukan harus berbasis data, mudah diuji, dan melibatkan orang-orang yang menjalankan proses.",
          "Pelajar yang memahami Kaizen akan lebih siap mengamati proses kerja, mengidentifikasi hambatan, dan mengusulkan solusi yang realistis.",
        ],
      },
    ],
    quiz: [
      {
        question: "Tujuan utama Kaizen adalah",
        options: ["Membuat perubahan besar sekaligus", "Perbaikan terus-menerus secara bertahap", "Mengurangi jumlah pekerja", "Mempercepat jam istirahat"],
        correct: 1,
      },
      {
        question: "Dalam Kaizen, masalah sebaiknya dipandang sebagai",
        options: ["Penyebab konflik", "Kesalahan individu", "Peluang perbaikan", "Tanda kegagalan"],
        correct: 2,
      },
    ],
  },
  {
    id: 2,
    slug: "analisis-masalah",
    title: "Analisis Masalah dan Root Cause",
    topic: "Modul 2",
    duration: "50 menit",
    description:
      "Belajar mengidentifikasi akar penyebab masalah dengan pendekatan sederhana dan visual yang mudah dipahami.",
    sections: [
      {
        title: "Mengapa akar masalah penting?",
        paragraphs: [
          "Sering kali gejala terlihat jelas, tetapi penyebab utamanya tersembunyi di balik proses, kebiasaan, atau sistem kerja. Dengan menemukan akar masalah, solusi yang diberikan menjadi lebih tepat dan tahan lama.",
          "Teknik sederhana seperti 5 Whys membantu mengurai akar masalah dari gejala yang muncul.",
        ],
      },
      {
        title: "Langkah awal analisis",
        paragraphs: [
          "Mulailah dari fakta yang terukur, kumpulkan bukti, lalu tanyakan mengapa masalah terjadi berulang kali. Perbaikan yang baik tidak dimulai dari asumsi, melainkan dari data yang terpercaya.",
          "Dalam praktiknya, tim sering menggabungkan observasi langsung dan diskusi sederhana untuk membuat pemetaan masalah yang lebih jelas.",
        ],
      },
    ],
    quiz: [
      {
        question: "Teknik 5 Whys digunakan untuk",
        options: ["Menghitung angka produksi", "Mencari akar masalah", "Mengatur jadwal kerja", "Membuat laporan keuangan"],
        correct: 1,
      },
      {
        question: "Langkah pertama yang baik dalam analisis masalah adalah",
        options: ["Asumsi cepat", "Mengumpulkan fakta", "Memindahkan pekerja", "Mengganti sistem"],
        correct: 1,
      },
    ],
  },
  {
    id: 3,
    slug: "diagram-pareto",
    title: "Diagram Pareto dan Prioritas Masalah",
    topic: "Modul 3",
    duration: "40 menit",
    description:
      "Memahami cara memprioritaskan masalah berdasarkan dampak dan frekuensi sehingga perbaikan lebih efektif.",
    sections: [
      {
        title: "Mengapa prioritas penting?",
        paragraphs: [
          "Tidak semua masalah memiliki dampak yang sama. Dengan diagram Pareto, kelompok masalah dapat diurutkan berdasarkan seberapa sering dan seberapa besar pengaruhnya terhadap hasil.",
          "Pendekatan ini membantu tim fokus pada penyebab yang paling signifikan sebelum mengerahkan energi ke masalah kecil.",
        ],
      },
      {
        title: "Menerapkan Pareto",
        paragraphs: [
          "Gunakan data sederhana untuk mengelompokkan masalah, lalu hitung persentase kontribusinya. Biasanya, sebagian kecil masalah menjadi sumber mayoritas gangguan.",
          "Dengan begitu, solusi yang dipilih akan memberikan hasil yang lebih terasa dan terukur.",
        ],
      },
    ],
    quiz: [
      {
        question: "Diagram Pareto membantu",
        options: ["Memilih prioritas masalah", "Mengganti operator", "Mengurangi jam kerja", "Menambah stok"],
        correct: 0,
      },
      {
        question: "Tujuan utama prioritas masalah adalah",
        options: ["Menyederhanakan dokumen", "Memusatkan tindakan pada masalah yang paling berdampak", "Memperlambat proses", "Meningkatkan biaya"],
        correct: 1,
      },
    ],
  },
  {
    id: 4,
    slug: "fishbone-analysis",
    title: "Diagram Tulang Ikan dan Identifikasi Penyebab",
    topic: "Modul 4",
    duration: "55 menit",
    description:
      "Mengenal diagram tulang ikan sebagai alat visual untuk mengorganisasi berbagai kemungkinan penyebab masalah.",
    sections: [
      {
        title: "Membuat diagram tulang ikan",
        paragraphs: [
          "Diagram tulang ikan membantu mengelompokkan kemungkinan penyebab masalah ke dalam kategori yang lebih teratur, seperti manusia, mesin, metode, material, lingkungan, dan pengukuran.",
          "Visual ini membuat diskusi tim menjadi lebih terarah karena setiap ide dapat ditempatkan pada kategori yang sesuai.",
        ],
      },
      {
        title: "Kapan digunakan",
        paragraphs: [
          "Diagram ini sangat cocok saat masalah kompleks muncul dan tidak ada satu penyebab tunggal yang terlihat jelas. Penggunaan diagram membantu tim melihat gambaran yang lebih luas.",
          "Hasilnya, pembahasan tidak lagi berputar pada satu teori saja, tetapi memunculkan banyak kemungkinan penyebab yang bisa diuji.",
        ],
      },
    ],
    quiz: [
      {
        question: "Diagram tulang ikan biasa digunakan untuk",
        options: ["Mengatur jadwal rapat", "Mengidentifikasi berbagai kemungkinan penyebab", "Membuat daftar absensi", "Menghitung bonus"],
        correct: 1,
      },
      {
        question: "Salah satu kategori pada diagram ini adalah",
        options: ["Kebijakan", "Material", "Promosi", "Kabupaten"],
        correct: 1,
      },
    ],
  },
  {
    id: 5,
    slug: "action-plan-kaizen",
    title: "Membuat Action Plan Kaizen",
    topic: "Modul 5",
    duration: "35 menit",
    description:
      "Menyusun rencana tindakan yang konkret setelah masalah teridentifikasi agar perubahan benar-benar bisa diterapkan.",
    sections: [
      {
        title: "Mengubah temuan menjadi tindakan",
        paragraphs: [
          "Setelah akar masalah ditemukan, langkah selanjutnya adalah merancang tindakan yang spesifik, terukur, dan realistis. Action plan memudahkan tim mengawasi progres pelaksanaan.",
          "Rencana yang baik tidak hanya menyebutkan apa yang harus dilakukan, tetapi juga siapa yang bertanggung jawab dan kapan hasilnya dievaluasi.",
        ],
      },
      {
        title: "Elemen penting action plan",
        paragraphs: [
          "Masukkan target, langkah kerja, siapa yang bertanggung jawab, batas waktu, dan indikator keberhasilan. Dengan kerangka ini, pelaksanaan perbaikan menjadi lebih fokus dan mudah dikendalikan.",
          "Action plan juga membantu menjaga keberlanjutan perbaikan karena hasilnya dapat dipantau secara berkala.",
        ],
      },
    ],
    quiz: [
      {
        question: "Action plan membantu",
        options: ["Menghapus semua masalah", "Mengendalikan pelaksanaan perbaikan", "Membuat proses lebih lama", "Mengurangi tanggung jawab"],
        correct: 1,
      },
      {
        question: "Salah satu elemen penting action plan adalah",
        options: ["Batas waktu", "Jumlah karyawan", "Warna meja", "Jarak kantor"],
        correct: 0,
      },
    ],
  },
];

export default materiModules;
