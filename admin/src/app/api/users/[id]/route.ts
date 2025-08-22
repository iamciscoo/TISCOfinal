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

    const body = await req.json().catch(() => ({} as Record<string, any>));

    const allowedFields = [
      "email",
      "first_name",
      "last_name",
      "phone",
      "avatar_url",
      "is_verified",
    ] as const;

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key as keyof typeof body];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
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
