import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

// GET /api/profiles/[id]/comments/[commentId]/replies (목록)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;

  const { data, error } = await supabaseAdmin
    .from("profile_comment_replies")
    .select("id,comment_id,name,avatar,content,image_urls,is_admin,created_at") // ✅ 여기 추가!
    .eq("comment_id", commentId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: data ?? [] });
}

// POST /api/profiles/[id]/comments/[commentId]/replies (작성)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const avatar = String(body?.avatar ?? "🙂").trim() || "🙂";
  const content = String(body?.content ?? "").trim();
const image_urls = Array.isArray(body?.image_urls) ? body.image_urls.filter(Boolean) : [];
  const password = String(body?.password ?? "").trim();
  const adminKey = String(body?.adminKey ?? "").trim();

  const isAdmin = isAdminKey(adminKey);

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  if (!isAdmin && password.length < 4) {
    return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });
  }

  const pw_hash = isAdmin ? null : hashPw(password);

  const { data, error } = await supabaseAdmin
    .from("profile_comment_replies")
    .insert({
      comment_id: commentId,
      name,
      avatar,
      content,
      image_urls,
      pw_hash,
      is_admin: isAdmin,
    })
    .select("id,comment_id,name,avatar,content,image_urls,is_admin,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reply: data });
}
