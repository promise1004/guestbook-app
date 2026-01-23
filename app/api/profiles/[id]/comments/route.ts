import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";

export const runtime = "nodejs";

// GET /api/profiles/[id]/comments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("profile_comments")
      .select("id,post_id,name,avatar,content,image_urls,likes_count,created_at")
      .eq("post_id", id)
      // ✅ 베스트(추천수 높은) 먼저
      .order("likes_count", { ascending: false, nullsFirst: false })
      // ✅ 같은 추천수면 최신이 위
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comments: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}

// POST /api/profiles/[id]/comments  (작성)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const avatar = String(body?.avatar ?? "🙂").trim() || "🙂"; // ✅ 추가
    const content = String(body?.content ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const image_urls = Array.isArray(body?.image_urls) ? body.image_urls : [];

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });
    if (password.length < 4)
      return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });

    const pw_hash = hashPw(password);

    const { data, error } = await supabaseAdmin
      .from("profile_comments")
      .insert({ post_id: id, name, avatar, content, image_urls, pw_hash }) // ✅ avatar 추가
      .select("id,post_id,name,avatar,content,image_urls,created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comment: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}

