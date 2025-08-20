import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

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

    const BUCKET = 'product_images';

    // Ensure bucket exists; create if missing
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const hasBucket = buckets?.some((b: any) => b.name === BUCKET);
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
    const createdImages: any[] = [];
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
        const main = inserted?.find((r: any) => r.is_main);
        if (main) {
          await supabase
            .from('products')
            .update({ image_url: main.url })
            .eq('id', productId);
        }
      } catch (e: any) {
        // Swallow DB errors and still return uploaded URLs
        // eslint-disable-next-line no-console
        console.error('Upload DB insert error:', e?.message || e);
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}

