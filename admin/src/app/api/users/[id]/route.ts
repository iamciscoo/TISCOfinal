import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as any;

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

    const updates: Record<string, any> = {};
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
    let user: any = null
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
    let updatedAddress: any = null
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
        const addrUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    // 1) Delete from Clerk (user id equals Clerk user ID)
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      return NextResponse.json({ error: "Server misconfiguration: CLERK_SECRET_KEY is not set" }, { status: 500 });
    }

    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
      },
    });

    // If the user doesn't exist in Clerk, treat as success and continue to DB delete
    if (!clerkRes.ok && clerkRes.status !== 404) {
      const details = await clerkRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'Failed to delete user in Clerk', details: details || undefined },
        { status: clerkRes.status || 500 }
      );
    }

    // 2) Delete from our database
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Return a standard JSON response to avoid 204-with-body issues
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
