import { supabase } from "@/lib/supabase";

/**
 * Mengunggah file ke Supabase Storage jika dikonfigurasi.
 * Jika tidak dikonfigurasi (null), otomatis fallback menggunakan Base64 reader.
 * 
 * @param file File objek dari input picker
 * @param folder Nama sub-folder di bucket (contoh: 'materi', 'project', 'revisi')
 * @returns String URL publik atau string data URI Base64
 */
export async function uploadFileOrBase64(file: File, folder: string): Promise<string> {
  if (supabase) {
    try {
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `${folder}/${Date.now()}-${randomStr}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("lms-files")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Gagal mengunggah ke Supabase Storage:", error);
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("lms-files")
        .getPublicUrl(fileName);

      console.log(`Berhasil mengunggah file ke Supabase: ${publicUrl}`);
      return publicUrl;
    } catch (err) {
      console.warn("Upload Supabase gagal, menggunakan fallback Base64...", err);
    }
  }

  // Fallback to Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
