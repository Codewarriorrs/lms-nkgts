export const INVALID_SCHOOL_NAMES = /^(asal[\s_]*sekolah|nama[\s_]*sekolah|sekolah|school|institusi|lembaga|null|undefined|-)$/i;

export function normalizeSchoolName(name: string): string {
  if (!name) return '';
  let clean = name.trim().replace(/\s+/g, ' ');
  clean = clean.replace(/\bSMKN\b/gi, 'SMK Negeri');
  clean = clean.replace(/\bSMK\s+N\b/gi, 'SMK Negeri');
  clean = clean.replace(/\bSMK\s*NEGERI\b/gi, 'SMK Negeri');
  return clean;
}

export function isInvalidSchoolName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed.length < 3) return true;
  // Jika tidak mengandung huruf sama sekali (misal hanya angka, simbol, tanda baca)
  if (!/[a-zA-Z]/.test(trimmed)) return true;
  // Jika hanya berupa tanda baca/simbol
  if (/^[\W_]+$/.test(trimmed)) return true;
  // Cocok dengan regex blacklist kata kunci sampah header spreadsheet
  if (INVALID_SCHOOL_NAMES.test(trimmed)) return true;
  return false;
}
