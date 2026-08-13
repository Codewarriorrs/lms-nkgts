import { API_URL } from "@/lib/api";

/**
 * Mengunggah file ke Biznet S3 melalui API Backend.
 * Jika terjadi kegagalan, otomatis fallback menggunakan Base64 reader.
 * 
 * @param file File objek dari input picker
 * @param folder Nama sub-folder di bucket (contoh: 'materi', 'project', 'revisi', 'galeri')
 * @returns String URL publik atau string data URI Base64
 */
export async function uploadFileOrBase64(file: File, folder: string): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(`Mencoba mengunggah berkas ke Biznet S3 via Backend: folder=${folder}`);
      const res = await fetch(`${API_URL}/upload/file?folder=${folder}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          console.log(`Berhasil mengunggah file ke Biznet S3: ${data.url}`);
          return data.url;
        }
      }
      console.warn("Gagal mengunggah ke backend (status not OK), menggunakan fallback Base64...");
    } catch (err) {
      console.warn("Upload ke backend gagal, menggunakan fallback Base64...", err);
    }
  } else {
    console.warn("Token otentikasi tidak ditemukan, menggunakan fallback Base64...");
  }

  // Fallback to Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
