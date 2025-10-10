import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';


export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({} as Partial<{
      email: string
      first_name: string
      last_name: string
      phone: string
      avatar_url: string
      is_verified: boolean
      address: string
      address_line_1: string
      city: string
    }>)));

    const allowedFields = [
      "email",
      "first_name",
      "last_name",
      "phone",
      "avatar_url",
      "is_verified",
      // keep user profile address fields in sync as well
      "address_line_1",
      "city",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Prepare address update intent first
    const addressInput: { address?: string; address_line_1?: string; city?: string } = {
      address: body.address,
      address_line_1: body.address_line_1,
      city: body.city,
    }
    const address_line_1 = addressInput.address_line_1 ?? addressInput.address
    const city = addressInput.city
    const hasAddressUpdate = (
      (address_line_1 && String(address_line_1).trim().length > 0) ||
      (city && String(city).trim().length > 0)
    )

    // If there are no valid user fields AND no address update, bail out
    if (Object.keys(updates).length === 0 && !hasAddressUpdate) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update user if needed, otherwise fetch existing to return
    let user: Record<string, unknown> | null = null
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { data: upd, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      user = upd
    } else {
      const { data: existing, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      user = existing
    }

    // Optional: update the user's default shipping address if address fields were provided
    let updatedAddress: Record<string, unknown> | null = null
    if (hasAddressUpdate) {
      // Find current default shipping address
      const { data: found, error: findErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', id)
        .eq('type', 'shipping')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (findErr) {
        // Do not fail the whole request for address issues
        console.error('Find default address error:', findErr.message)
      }

      const existing = Array.isArray(found) && found.length ? found[0] : null
      if (existing) {
        const addrUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (address_line_1 && String(address_line_1).trim()) addrUpdates.address_line_1 = String(address_line_1).trim()
        if (city && String(city).trim()) addrUpdates.city = String(city).trim()

        const { data: addr, error: addrErr } = await supabase
          .from('addresses')
          .update(addrUpdates)
          .eq('id', existing.id)
          .select()
          .single()

        if (addrErr) {
          console.error('Update default address error:', addrErr.message)
        } else {
          updatedAddress = addr
        }
      }
    }

    return NextResponse.json({ data: user, default_shipping_address: updatedAddress }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    // **STEP 1: Fetch user data before deletion**
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, avatar_url, auth_user_id, first_name, last_name, email, phone')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // **STEP 2: Delete avatar from storage if it exists**
    if (user?.avatar_url) {
      const avatarPath = extractAvatarPath(user.avatar_url);
      if (avatarPath) {
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([avatarPath]);

        if (storageError) {
          console.error('Error deleting avatar from storage:', storageError.message);
          // Continue with user deletion even if storage cleanup fails
        } else {
          console.log(`✅ Deleted avatar from storage for user ${id}`);
        }
      }
    }

    // **STEP 3: Preserve orders - copy user info to customer fields, then nullify user_id**
    // This satisfies the chk_orders_has_customer constraint which requires either user_id OR (customer_name AND customer_phone)
    const customerName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Deleted User';
    const customerEmail = user.email || null;
    // Phone is required by constraint, use placeholder if user has no phone (minimum 8 chars for safety)
    const customerPhone = user.phone || 'Not Available';

    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        user_id: null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      })
      .eq('user_id', id);

    if (orderError) {
      console.error('Error updating orders:', orderError.message);
      return NextResponse.json({ 
        error: `Failed to preserve orders: ${orderError.message}` 
      }, { status: 500 });
    } else {
      console.log(`✅ Preserved orders for deleted user ${id} with customer info`);
    }

    // **STEP 4: Delete from Supabase Auth (if auth_user_id exists)**
    if (user.auth_user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.auth_user_id
      );

      if (authError) {
        console.error('Error deleting user from Supabase Auth:', authError.message);
        // Continue with database deletion even if auth deletion fails
        // User may have already been deleted from auth manually
      } else {
        console.log(`✅ Deleted user from Supabase Auth: ${user.auth_user_id}`);
      }
    } else {
      console.warn(`⚠️ No auth_user_id found for user ${id}, skipping auth deletion`);
    }

    // **STEP 5: Delete user from database (cascades to addresses, reviews, etc. via FK)**
    // Orders are preserved with nullified user_id
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    console.log('✅ User deleted successfully from database and auth with preserved orders:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully from database and authentication system',
      preserved_orders: true 
    }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to extract storage path from avatar URL
function extractAvatarPath(url: string): string | null {
  try {
    // Format: https://{project}.supabase.co/storage/v1/object/public/avatars/{user_id}/{filename}
    const match = url.match(/\/avatars\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
