import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';


export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await context.params;
    if (!productId) return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });

    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await context.params;
    if (!productId) return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });

    const body = await req.json().catch(() => ({} as Partial<{ id: string; is_main: boolean; sort_order: number }>));
    const imageId: string | undefined = body.id;
    const setMain: boolean | undefined = body.is_main;
    const sortOrder: number | undefined = typeof body.sort_order === 'number' ? body.sort_order : undefined;

    if (!imageId) return NextResponse.json({ error: "Missing 'id' of image" }, { status: 400 });

    // Update sort_order only
    if (typeof sortOrder === 'number') {
      const { error } = await supabase
        .from('product_images')
        .update({ sort_order: sortOrder })
        .eq('id', imageId)
        .eq('product_id', productId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Set main image
    if (setMain === true) {
      // Unset other mains for this product
      const { error: unsetErr } = await supabase
        .from('product_images')
        .update({ is_main: false })
        .eq('product_id', productId);
      if (unsetErr) return NextResponse.json({ error: unsetErr.message }, { status: 500 });

      // Set main on target image and fetch its url
      const { data: updated, error: setErr } = await supabase
        .from('product_images')
        .update({ is_main: true })
        .eq('id', imageId)
        .eq('product_id', productId)
        .select()
        .single();
      if (setErr) return NextResponse.json({ error: setErr.message }, { status: 500 });

      // Sync products.image_url for backward compatibility
      if (updated?.url) {
        await supabase
          .from('products')
          .update({ image_url: updated.url })
          .eq('id', productId);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await context.params;
    if (!productId) return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('id') || '';
    if (!imageId) return NextResponse.json({ error: "Missing 'id' of image" }, { status: 400 });

    // Fetch image to know if it was main
    const { data: img, error: fetchErr } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // Delete the image
    const { error: delErr } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Try to remove from storage (best effort)
    try {
      const BUCKET = 'product_images';
      if (img?.path) {
        await supabase.storage.from(BUCKET).remove([img.path]);
      }
    } catch {}

    // If it was main, pick a new main (first by sort_order, created_at)
    if (img?.is_main) {
      const { data: nextImages } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);
      const nextMain = nextImages && nextImages[0];
      if (nextMain) {
        await supabase
          .from('product_images')
          .update({ is_main: true })
          .eq('id', nextMain.id);
        await supabase
          .from('products')
          .update({ image_url: nextMain.url })
          .eq('id', productId);
      } else {
        // No images left, clear products.image_url
        await supabase
          .from('products')
          .update({ image_url: null })
          .eq('id', productId);
      }
    }

    return new Response(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

