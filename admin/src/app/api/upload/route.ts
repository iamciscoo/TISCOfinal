import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

// Image validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size: 5MB`;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const productId = (formData.get('productId') || formData.get('product_id') || '') as string;
    const isMainParam = (formData.get('is_main') || '') as string;
    const orderParam = (formData.get('order') || formData.get('sort_order') || '') as string;

    // Support multiple files via `files` field; fallback to single `file`
    const filesFromMulti = formData.getAll('files').filter(Boolean) as File[];
    const singleFile = formData.get('file') as File | null;
    const files: File[] = filesFromMulti.length > 0
      ? filesFromMulti
      : (singleFile ? [singleFile] : []);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate all files
    for (const file of files) {
      const validationError = validateImage(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const BUCKET = 'product-images';

    // Ensure bucket exists; create if missing
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const hasBucket = Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET);
    if (!hasBucket) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }
    }

    const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = productId ? `products/${productId}` : 'products';

    const uploaded: { path: string; url: string }[] = [];
    for (const f of files) {
      const filePath = `${prefix}/${Date.now()}-${sanitize(f.name)}`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, f);
      if (uploadErr) {
        return NextResponse.json({ error: uploadErr.message }, { status: 500 });
      }
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);
      uploaded.push({ path: filePath, url: publicUrlData.publicUrl });
    }

    // Optionally create DB records when productId is provided
    const createdImages: Array<{ id?: string; url: string; path: string; is_main?: boolean; sort_order?: number }> = [];
    if (productId) {
      const isMain = String(isMainParam).toLowerCase() === 'true';
      const sortOrder = Number.isFinite(parseInt(orderParam)) ? parseInt(orderParam) : 0;
      try {
        const rows = uploaded.map((u, idx) => ({
          product_id: productId,
          url: u.url,
          path: u.path,
          is_main: isMain && idx === 0, // apply is_main to first file only if set
          sort_order: sortOrder + idx,
        }));
        const { data: inserted, error: insertErr } = await supabase
          .from('product_images')
          .insert(rows)
          .select();
        if (!insertErr && inserted) createdImages.push(...inserted);

        // If any inserted image marked main, sync products.image_url
        const main = inserted?.find((r: { is_main?: boolean }) => r.is_main);
        if (main) {
          await supabase
            .from('products')
            .update({ image_url: main.url })
            .eq('id', productId);
        }
      } catch (e) {
        // Swallow DB errors and still return uploaded URLs
        // eslint-disable-next-line no-console
        console.error('Upload DB insert error:', e instanceof Error ? e.message : e);
      }
    }

    // Backward-compatible response: if single file, return { url }, else { urls }
    if (uploaded.length === 1) {
      return NextResponse.json(
        { url: uploaded[0].url, image: createdImages[0], images: createdImages },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { urls: uploaded.map(u => u.url), images: createdImages },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

