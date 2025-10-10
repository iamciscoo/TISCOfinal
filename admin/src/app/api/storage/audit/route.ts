import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

/**
 * Storage Audit API
 * Finds orphaned images in Supabase storage that aren't tied to any product or user
 */
export async function GET() {
  try {
    const orphanedFiles: {
      bucket: string;
      path: string;
      size: number;
      created_at: string;
    }[] = [];
    
    let totalOrphaned = 0;
    let totalOrphanedSize = 0;

    // **AUDIT 1: Check product-images bucket**
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
      // Get all product image URLs from database
      const { data: productImages, error: productImagesError } = await supabase
        .from('product_images')
        .select('url, path');

      if (productImagesError) {
        console.error('Error fetching product images:', productImagesError.message);
      }

      // Create a Set of valid paths for quick lookup
      const validProductPaths = new Set<string>();
      productImages?.forEach(img => {
        if (img.path) {
          validProductPaths.add(img.path);
        }
        // Also extract path from URL if path field is not set
        if (img.url) {
          const match = img.url.match(/\/product-images\/(.+)$/);
          if (match) validProductPaths.add(match[1]);
        }
      });

      // Check each storage file
      for (const file of productStorageFiles) {
        if (file.name === '.emptyFolderPlaceholder') continue; // Skip folder placeholders
        
        const fullPath = `products/${file.name}`;
        
        // Check if this path exists in database
        if (!validProductPaths.has(fullPath)) {
          totalOrphaned++;
          totalOrphanedSize += file.metadata?.size || 0;
          orphanedFiles.push({
            bucket: 'product-images',
            path: fullPath,
            size: file.metadata?.size || 0,
            created_at: file.created_at || 'unknown'
          });
        }
      }
    }

    // **AUDIT 2: Check avatars bucket**
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
      // Get all user avatar URLs from database
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, avatar_url')
        .not('avatar_url', 'is', null);

      if (usersError) {
        console.error('Error fetching users:', usersError.message);
      }

      // Create a Set of valid avatar paths
      const validAvatarPaths = new Set<string>();
      users?.forEach(user => {
        if (user.avatar_url) {
          const match = user.avatar_url.match(/\/avatars\/(.+)$/);
          if (match) validAvatarPaths.add(match[1]);
        }
      });

      // Check each avatar file
      for (const file of avatarStorageFiles) {
        if (file.name === '.emptyFolderPlaceholder') continue;
        
        // For avatars, check if user folder exists
        if (!validAvatarPaths.has(file.name)) {
          totalOrphaned++;
          totalOrphanedSize += file.metadata?.size || 0;
          orphanedFiles.push({
            bucket: 'avatars',
            path: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at || 'unknown'
          });
        }
      }
    }

    // Format size for display
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return NextResponse.json({
      success: true,
      summary: {
        total_orphaned_files: totalOrphaned,
        total_orphaned_size: formatBytes(totalOrphanedSize),
        total_orphaned_size_bytes: totalOrphanedSize,
      },
      orphaned_files: orphanedFiles.map(file => ({
        ...file,
        size_formatted: formatBytes(file.size)
      })),
      recommendations: totalOrphaned > 0 
        ? 'Consider cleaning up orphaned files to free storage space. Use the /api/storage/cleanup endpoint with caution.'
        : 'No orphaned files found. Storage is clean!'
    }, { status: 200 });

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
