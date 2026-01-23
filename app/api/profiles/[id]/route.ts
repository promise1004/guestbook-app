import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminKey } from "@/lib/admin"; // ✅ 추가

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

// ✅ DELETE /api/profiles/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({} as any));
  const adminKey = String(body.adminKey ?? "").trim();

  if (!isAdminKey(adminKey)) {
    return NextResponse.json({ error: "관리자만 삭제 가능" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("profile_posts")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// ✅ PUT /api/profiles/[id]  (프로필 수정)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({} as any));

  const adminKey = String(body.adminKey ?? "").trim();
  if (!isAdminKey(adminKey)) {
    return NextResponse.json({ error: "관리자만 수정 가능" }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const role = body.role === null ? null : String(body.role ?? "").trim();
  const bio = body.bio === null ? null : String(body.bio ?? "").trim();
  const cover_url = body.cover_url === null ? null : String(body.cover_url ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "이름(title)을 입력하세요" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profile_posts")
    .update({
      title,
      role,
      bio,
      cover_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,title,role,bio,cover_url,image_urls,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, post: data });
}
