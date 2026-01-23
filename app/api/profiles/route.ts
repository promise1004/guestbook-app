// app/api/profiles/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminKey } from "@/lib/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("profile_posts_with_comment_count")
    .select("id,title,role,bio,cover_url,image_urls,created_at,comment_count")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    debug: "USING_VIEW_ROUTE_v1",
    first: (data ?? [])[0] ?? null,
    posts: data ?? [],
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { adminKey, title, role, bio, cover_url, image_urls } = body ?? {};

  if (!isAdminKey(adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!title || String(title).trim().length < 1) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profile_posts")
    .insert([
      {
        title: String(title).trim(),
        role: String(role ?? "").trim(),
        bio: String(bio ?? "").trim(),
        cover_url: String(cover_url ?? "").trim(),
        image_urls: Array.isArray(image_urls) ? image_urls : [],
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post: { ...data, comment_count: 0 } });
}
