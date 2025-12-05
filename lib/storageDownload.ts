import { supabase } from '@/lib/supabase';

export async function downloadBytes(bucket: string, path: string): Promise<Uint8Array> {
  if (!bucket || !path) throw new Error(`downloadBytes missing bucket/path: ${bucket}/${path}`);
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  const ab = await data.arrayBuffer();
  return new Uint8Array(ab);
}

export function looksLikePdf(bytes: Uint8Array) {
  return bytes.length > 5 &&
         bytes[0] === 0x25 && bytes[1] === 0x50 &&
         bytes[2] === 0x44 && bytes[3] === 0x46 &&
         bytes[4] === 0x2D; // %PDF-
}