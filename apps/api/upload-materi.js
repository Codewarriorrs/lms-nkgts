const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const s3 = new S3Client({
  endpoint: process.env.BIZNET_S3_ENDPOINT,
  region: process.env.BIZNET_S3_REGION || 'sgp1',
  credentials: {
    accessKeyId: process.env.BIZNET_S3_ACCESS_KEY,
    secretAccessKey: process.env.BIZNET_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const bucket = process.env.BIZNET_S3_BUCKET;

const materiList = [
  {
    name: 'MATERI_1_PENGENALAN_BUDAYA_KAIZEN.pptx',
    url: 'https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%201%20(PENGENALAN%20BUDAYA%20KAIZEN)%20(1).pptx'
  },
  {
    name: 'MATERI_2_5R.pptx',
    url: 'https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%202%20(5R).pptx'
  },
  {
    name: 'MATERI_3_6_POTENSI_BAHAYA.pptx',
    url: 'https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%203%20(6%20POTENSI%20BAHAYA).pptx'
  },
  {
    name: 'MATERI_4_7_PEMBOROSAN.pptx',
    url: 'https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%204%20(7%20PEMBOROSAN).pptx'
  },
  {
    name: 'MATERI_5_8_LANGKAH_PENYELESAIAN_MASALAH.pptx',
    url: 'https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%205%20(8%20LANGKAH%20PENYELESAIAN%20MASALAH).pptx'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function uploadToS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ACL: 'public-read'
  });
  await s3.send(command);
  return `${process.env.BIZNET_S3_ENDPOINT}/${bucket}/${key}`;
}

async function run() {
  console.log('Memulai migrasi file materi dari Supabase ke Biznet S3...');
  console.log(`Bucket: ${bucket}`);
  console.log(`Endpoint: ${process.env.BIZNET_S3_ENDPOINT}`);

  for (const item of materiList) {
    const tempPath = path.join(__dirname, item.name);
    console.log(`\n--------------------------------------------`);
    console.log(`Mengunduh: ${item.name}...`);
    try {
      await downloadFile(item.url, tempPath);
      console.log(`Sukses mengunduh. Mengunggah ke Biznet S3...`);
      
      const s3Key = `materi/${item.name}`;
      const newUrl = await uploadToS3(tempPath, s3Key);
      console.log(`SUKSES diunggah! URL Baru:\n${newUrl}`);
      
      // Hapus file sementara
      fs.unlinkSync(tempPath);
    } catch (error) {
      console.error(`Gagal memigrasi ${item.name}:`, error.message);
    }
  }
  console.log('\nMigrasi Selesai.');
}

run();
