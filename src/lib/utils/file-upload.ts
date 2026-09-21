export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export async function uploadFile(file: File, folder: string): Promise<UploadResult> {
  // In production, this would upload to cloud storage (Vercel Blob, AWS S3, etc.)
  // For now, we return a placeholder URL that includes the file info
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  // Create a data URL for preview (in production, upload to actual storage)
  const base64 = await fileToBase64(file);
  
  return {
    url: base64, // In production: actual cloud storage URL
    pathname: filename,
    contentType: file.type,
    size: file.size,
  };
}

export async function uploadFiles(files: File[], folder: string): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, folder))
  );
  return results;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}