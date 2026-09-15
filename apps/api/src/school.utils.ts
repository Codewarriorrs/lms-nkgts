export const INVALID_SCHOOL_NAMES =
  /^(asal[\s_]*sekolah|nama[\s_]*sekolah|sekolah|school|institusi|lembaga|null|undefined|-)$/i;

// Gelar akademik umum Indonesia & internasional (case-insensitive)
export const ACADEMIC_TITLES_REGEX =
  /(\b|,|\s)(s\.?pd|m\.?pd|s\.?t|m\.?t|s\.?kom|m\.?kom|s\.?sos|m\.?sos|s\.?e|m\.?m|m\.?ba|dr\.|drs\.|dra\.|prof\.|s\.?si|m\.?si|s\.?ked|b\.?sc|m\.?sc|ph\.?d|gr\.)(\b|\.|\s|$)/i;

// Blacklist nama-nama koordinator perorangan yang pernah masuk ke database
export const KNOWN_COORDINATOR_NAMES = [
  'anang waskito',
  'budi setiawan',
  'hasan ismail',
  'heri suryono',
  'tohadi',
  'tri mardiyanto',
  'windhu pinundi',
];

// Kata kunci nama institusi / sekolah yang valid
export const INSTITUTION_KEYWORD_REGEX =
  /(\b(smkn?|sman?|smpn?|man|mts|ma|sd|universitas|univ|institut|politeknik|poltek|sekolah|yayasan|akademi|negeri|swasta)\b|n-?kgts)/i;

export const CANONICAL_NKGTS = 'N-KGTS Pusat';
export const NKGTS_CANONICAL_KEY = 'nkgtspusat';

/**
 * Cek apakah string merupakan variasi dari NKGTS
 */
export function isNKGTS(name?: string | null): boolean {
  if (!name) return false;
  const clean = name.toLowerCase().replace(/[\s\-_/.]+/g, '');
  return clean === 'nkgts' || clean === 'nkgtspusat' || clean.includes('nkgts');
}

/**
 * Cek apakah string terindikasi kuat sebagai nama perorangan / koordinator
 */
export function isLikelyPersonOrCoordinator(name?: string | null): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // 1. Cek gelar akademik
  if (ACADEMIC_TITLES_REGEX.test(trimmed)) return true;

  // 2. Cek nama koordinator yang diketahui
  if (KNOWN_COORDINATOR_NAMES.some(coord => lower.includes(coord))) return true;

  // 3. Format nama dengan koma gelar, misal: "Budi, S.T" atau "Tohadi, M.Pd."
  if (/,/.test(trimmed) && !/sekolah|school|universitas|yayasan|institut/i.test(trimmed)) {
    if (ACADEMIC_TITLES_REGEX.test(trimmed)) return true;
  }

  // 4. Jika diawali gelar kehormatan / sapaan personal
  if (/^(bapak|ibu|bpk|ibu|pak|bu|ustadz|ustadzah|mr|mrs|ms)\b/i.test(trimmed)) return true;

  return false;
}

/**
 * Cek apakah string menyerupai nama institusi / sekolah yang sah
 */
export function isValidInstitutionName(name?: string | null): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (isInvalidSchoolName(trimmed)) return false;
  if (isLikelyPersonOrCoordinator(trimmed)) return false;
  return INSTITUTION_KEYWORD_REGEX.test(trimmed);
}

/**
 * Buat canonical key untuk pencocokan deduplikasi (menghapus spasi, tanda baca, standarisasi singkatan)
 */
export function getCanonicalSchoolKey(name?: string | null): string {
  if (!name) return '';
  let clean = name.trim().toLowerCase();

  if (isNKGTS(clean)) {
    return NKGTS_CANONICAL_KEY;
  }

  // Normalisasi singkatan sekolah
  clean = clean.replace(/\bsmkn\b/g, 'smk negeri');
  clean = clean.replace(/\bsmk\s+n\b/g, 'smk negeri');
  clean = clean.replace(/\bsman\b/g, 'sma negeri');
  clean = clean.replace(/\bsma\s+n\b/g, 'sma negeri');
  clean = clean.replace(/\bsmpn\b/g, 'smp negeri');
  clean = clean.replace(/\bsmp\s+n\b/g, 'smp negeri');

  // Typo koreksi spesifik
  clean = clean.replace(/\bgedangari\b/g, 'gedangsari');

  // Hapus semua tanda baca & spasi
  return clean.replace(/[\s\-_/.,'"`()]+/g, '');
}

/**
 * Standarisasi penulisan nama sekolah kanonikal yang rapi
 */
export function normalizeSchoolName(name: string): string {
  if (!name) return '';
  if (isNKGTS(name)) return CANONICAL_NKGTS;

  let clean = name.trim().replace(/\s+/g, ' ');

  // Singkatan umum sekolah ke format resmi
  clean = clean.replace(/\bSMKN\b/gi, 'SMK Negeri');
  clean = clean.replace(/\bSMK\s+N\b/gi, 'SMK Negeri');
  clean = clean.replace(/\bSMK\s*NEGERI\b/gi, 'SMK Negeri');
  clean = clean.replace(/\bSMAN\b/gi, 'SMA Negeri');
  clean = clean.replace(/\bSMA\s+N\b/gi, 'SMA Negeri');
  clean = clean.replace(/\bSMA\s*NEGERI\b/gi, 'SMA Negeri');
  clean = clean.replace(/\bSMPN\b/gi, 'SMP Negeri');
  clean = clean.replace(/\bSMP\s+N\b/gi, 'SMP Negeri');
  clean = clean.replace(/\bSMP\s*NEGERI\b/gi, 'SMP Negeri');

  // Typo perbaikan
  clean = clean.replace(/\bGEDANGARI\b/gi, 'Gedangsari');
  clean = clean.replace(/\bgedangari\b/gi, 'Gedangsari');

  // Title case untuk kata setelah "Negeri" jika uppercase semua
  if (clean === clean.toUpperCase() && clean.length > 5) {
    clean = clean
      .split(' ')
      .map(word => {
        const u = word.toUpperCase();
        if (['SMK', 'SMA', 'SMP', 'SD', 'MAN', 'MTS', 'MA', 'N-KGTS'].includes(u)) return u;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  return clean;
}

/**
 * Validasi apakah nama sekolah tidak valid / sampah / nama orang
 */
export function isInvalidSchoolName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed.length < 3) return true;

  // Jika tidak mengandung huruf sama sekali
  if (!/[a-zA-Z]/.test(trimmed)) return true;

  // Jika hanya berupa tanda baca / simbol
  if (/^[\W_]+$/.test(trimmed)) return true;

  // Blacklist header spreadsheet
  if (INVALID_SCHOOL_NAMES.test(trimmed)) return true;

  // Nama perorangan / koordinator / bergelar akademik
  if (isLikelyPersonOrCoordinator(trimmed)) return true;

  // Harus menyerupai nama institusi sah (kecuali jika nama tersebut jelas institusi)
  if (!INSTITUTION_KEYWORD_REGEX.test(trimmed)) return true;

  return false;
}

