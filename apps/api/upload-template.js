const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
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

async function run() {
  const filePath = path.join(__dirname, '../web/public/Template_Import_Pengguna_NKGTS.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('File tidak ditemukan:', filePath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath);
  const key = 'templates/Template_Import_Pengguna_NKGTS.xlsx';

  console.log(`Mengunggah ${filePath} ke Biznet S3...`);
  console.log(`Endpoint: ${process.env.BIZNET_S3_ENDPOINT}, Bucket: ${bucket}`);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ACL: 'public-read',
  });

  try {
    await s3.send(command);
    const publicUrl = `${process.env.BIZNET_S3_ENDPOINT}/${bucket}/${key}`;
    console.log('\n==================================================');
    console.log('BERHASIL DIUNGGAH KE BIZNET S3!');
    console.log('Public URL:', publicUrl);
    console.log('==================================================\n');
  } catch (error) {
    console.error('Gagal mengunggah ke Biznet S3:', error);
    process.exit(1);
  }
}

run();
