import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/profiles/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profile_posts")
    .select("id,title,role,bio,cover_url,image_urls,created_at")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ post: data });
}
