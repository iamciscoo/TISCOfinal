import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

/**
 * Storage Cleanup API
 * Deletes orphaned images from Supabase storage
 * Requires explicit confirmation to prevent accidental deletions
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Safety check: require explicit confirmation
    if (body.confirm !== 'DELETE_ORPHANED_FILES') {
      return NextResponse.json({
        error: 'Confirmation required',
        message: 'To delete orphaned files, send POST request with body: { "confirm": "DELETE_ORPHANED_FILES", "bucket": "product-images" | "avatars" | "all" }'
      }, { status: 400 });
    }

    const bucket = body.bucket || 'all';
    
    if (!['product-images', 'avatars', 'all'].includes(bucket)) {
      return NextResponse.json({
        error: 'Invalid bucket',
        message: 'Bucket must be "product-images", "avatars", or "all"'
      }, { status: 400 });
    }

    const deletedFiles: { bucket: string; path: string }[] = [];
    let totalDeleted = 0;

    // **CLEANUP 1: product-images bucket**
    if (bucket === 'product-images' || bucket === 'all') {
      const { data: productStorageFiles, error: productStorageError } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (productStorageError) {
        console.error('Error listing product storage:', productStorageError.message);
      }

      if (productStorageFiles) {
        // Get all valid product image paths
        const { data: productImages } = await supabase
          .from('product_images')
          .select('url, path');

        const validProductPaths = new Set<string>();
        productImages?.forEach(img => {
          if (img.path) validProductPaths.add(img.path);
          if (img.url) {
            const match = img.url.match(/\/product-images\/(.+)$/);
            if (match) validProductPaths.add(match[1]);
          }
        });

        // Find orphaned files
        const orphanedPaths: string[] = [];
        for (const file of productStorageFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          
          const fullPath = `products/${file.name}`;
          if (!validProductPaths.has(fullPath)) {
            orphanedPaths.push(fullPath);
          }
        }

        // Delete orphaned files in batches
        if (orphanedPaths.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < orphanedPaths.length; i += batchSize) {
            const batch = orphanedPaths.slice(i, i + batchSize);
            const { error: deleteError } = await supabase.storage
              .from('product-images')
              .remove(batch);

            if (deleteError) {
              console.error('Error deleting product images batch:', deleteError.message);
            } else {
              batch.forEach(path => {
                deletedFiles.push({ bucket: 'product-images', path });
                totalDeleted++;
              });
            }
          }
        }
      }
    }

    // **CLEANUP 2: avatars bucket**
    if (bucket === 'avatars' || bucket === 'all') {
      const { data: avatarStorageFiles, error: avatarStorageError } = await supabase.storage
        .from('avatars')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (avatarStorageError) {
        console.error('Error listing avatar storage:', avatarStorageError.message);
      }

      if (avatarStorageFiles) {
        // Get all valid avatar paths
        const { data: users } = await supabase
          .from('users')
          .select('avatar_url')
          .not('avatar_url', 'is', null);

        const validAvatarPaths = new Set<string>();
        users?.forEach(user => {
          if (user.avatar_url) {
            const match = user.avatar_url.match(/\/avatars\/(.+)$/);
            if (match) validAvatarPaths.add(match[1]);
          }
        });

        // Find orphaned files
        const orphanedPaths: string[] = [];
        for (const file of avatarStorageFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          
          if (!validAvatarPaths.has(file.name)) {
            orphanedPaths.push(file.name);
          }
        }

        // Delete orphaned files
        if (orphanedPaths.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < orphanedPaths.length; i += batchSize) {
            const batch = orphanedPaths.slice(i, i + batchSize);
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove(batch);

            if (deleteError) {
              console.error('Error deleting avatars batch:', deleteError.message);
            } else {
              batch.forEach(path => {
                deletedFiles.push({ bucket: 'avatars', path });
                totalDeleted++;
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} orphaned files`,
      deleted_files: deletedFiles,
      total_deleted: totalDeleted
    }, { status: 200 });

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
