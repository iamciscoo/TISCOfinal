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

    console.log(`Processing ${files.length} file(s) for product ${productId || 'unknown'}`);

    // Validate all files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File)) {
        return NextResponse.json({ error: `Item ${i + 1} is not a valid file` }, { status: 400 });
      }
      
      const validationError = validateImage(file);
      if (validationError) {
        return NextResponse.json({ error: `File ${i + 1} (${file.name}): ${validationError}` }, { status: 400 });
      }
      
      console.log(`File ${i + 1}: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    const BUCKET = 'product-images';

    // Ensure bucket exists; create if missing
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      console.error('Failed to list buckets:', listErr);
      return NextResponse.json({ error: `Storage error: ${listErr.message}` }, { status: 500 });
    }
    
    const hasBucket = Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET);
    if (!hasBucket) {
      console.log(`Creating bucket: ${BUCKET}`);
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, { 
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_FILE_SIZE
      });
      if (createErr) {
        console.error('Failed to create bucket:', createErr);
        return NextResponse.json({ error: `Failed to create storage bucket: ${createErr.message}` }, { status: 500 });
      }
      console.log(`Bucket ${BUCKET} created successfully`);
    }

    const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = productId ? `products/${productId}` : 'products';

    const uploaded: { path: string; url: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const timestamp = Date.now();
      const filePath = `${prefix}/${timestamp}-${i}-${sanitize(f.name)}`;
      
      console.log(`Uploading file ${i + 1}/${files.length}: ${f.name} to ${filePath}`);
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, f, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadErr) {
        console.error(`Upload failed for ${f.name}:`, uploadErr);
        return NextResponse.json({ 
          error: `Failed to upload ${f.name}: ${uploadErr.message}` 
        }, { status: 500 });
      }
      
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);
        
      if (!publicUrlData?.publicUrl) {
        console.error(`Failed to get public URL for ${filePath}`);
        return NextResponse.json({ 
          error: `Failed to get public URL for ${f.name}` 
        }, { status: 500 });
      }
      
      uploaded.push({ path: filePath, url: publicUrlData.publicUrl });
      console.log(`Successfully uploaded: ${f.name} -> ${publicUrlData.publicUrl}`);
    }

    // Optionally create DB records when productId is provided
    const createdImages: Array<{ id?: string; url: string; path: string; is_main?: boolean; sort_order?: number }> = [];
    if (productId) {
      console.log(`Creating database records for product ${productId}`);
      const isMain = String(isMainParam).toLowerCase() === 'true';
      
      try {
        // BUGFIX: Get the current max sort_order to assign sequential values
        const { data: existingImages, error: fetchError } = await supabase
          .from('product_images')
          .select('sort_order')
          .eq('product_id', productId)
          .order('sort_order', { ascending: false })
          .limit(1);
        
        if (fetchError) {
          console.error('Error fetching existing images:', fetchError);
        }
        
        // Use provided sort_order if available, otherwise calculate automatically
        const providedOrder = orderParam ? parseInt(orderParam, 10) : null;
        
        let rows;
        if (providedOrder !== null && !isNaN(providedOrder)) {
          // Use the provided sort_order directly
          console.log(`Using provided sort_order: ${providedOrder}`);
          rows = uploaded.map((u, idx) => ({
            product_id: productId,
            url: u.url,
            path: u.path,
            is_main: isMain && idx === 0,
            sort_order: providedOrder + idx,
          }));
        } else {
          // Calculate automatically from max + 1
          const maxSortOrder = existingImages && existingImages.length > 0 
            ? (existingImages[0].sort_order ?? 0) 
            : 0;
          const startingSortOrder = Math.max(maxSortOrder + 1, 1);
          
          console.log(`Existing max sort_order: ${maxSortOrder}, starting from: ${startingSortOrder}`);
          
          rows = uploaded.map((u, idx) => ({
            product_id: productId,
            url: u.url,
            path: u.path,
            is_main: isMain && idx === 0,
            sort_order: startingSortOrder + idx,
          }));
        }
        
        console.log(`Inserting ${rows.length} image record(s)`);
        const { data: inserted, error: insertErr } = await supabase
          .from('product_images')
          .insert(rows)
          .select();
          
        if (insertErr) {
          console.error('Database insert error:', insertErr);
          return NextResponse.json({ 
            error: `Failed to save image records: ${insertErr.message}` 
          }, { status: 500 });
        }
        
        if (inserted && inserted.length > 0) {
          createdImages.push(...inserted);
          console.log(`Successfully inserted ${inserted.length} image record(s)`);
          
          // If any inserted image marked main, sync products.image_url
          const main = inserted.find((r: { is_main?: boolean }) => r.is_main);
          if (main) {
            console.log(`Updating product ${productId} main image URL to: ${main.url}`);
            const { error: updateErr } = await supabase
              .from('products')
              .update({ image_url: main.url })
              .eq('id', productId);
              
            if (updateErr) {
              console.error('Failed to update product main image:', updateErr);
              // Don't fail the entire operation for this
            }
          }
        }
      } catch (e) {
        console.error('Upload DB operation error:', e instanceof Error ? e.message : e);
        return NextResponse.json({ 
          error: `Database operation failed: ${e instanceof Error ? e.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }

    console.log(`Upload operation completed successfully. Files: ${uploaded.length}, DB records: ${createdImages.length}`);
    
    // Backward-compatible response: if single file, return { url }, else { urls }
    if (uploaded.length === 1) {
      return NextResponse.json(
        { 
          success: true,
          url: uploaded[0].url, 
          image: createdImages[0], 
          images: createdImages,
          message: `Successfully uploaded ${uploaded.length} image(s)`
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { 
        success: true,
        urls: uploaded.map(u => u.url), 
        images: createdImages,
        message: `Successfully uploaded ${uploaded.length} image(s)`
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('Upload route error:', e);
    return NextResponse.json({ 
      success: false,
      error: message 
    }, { status: 500 });
  }
}

