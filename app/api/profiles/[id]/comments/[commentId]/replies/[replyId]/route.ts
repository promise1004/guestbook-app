import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

// PATCH /api/profiles/[id]/comments/[commentId]/replies/[replyId] (수정)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  const { replyId } = await params;

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  const password = String(body?.password ?? "").trim();
  const adminKey = String(body?.adminKey ?? "").trim();
  const isAdmin = isAdminKey(adminKey);

  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  if (!isAdmin && password.length < 4) {
    return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });
  }

  // 비번 확인(관리자면 스킵)
  if (!isAdmin) {
    const { data: row, error: e0 } = await supabaseAdmin
      .from("profile_comment_replies")
      .select("pw_hash")
      .eq("id", replyId)
      .single();

    if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (row.pw_hash !== hashPw(password)) {
      return NextResponse.json({ error: "wrong password" }, { status: 401 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profile_comment_replies")
    .update({ content })
    .eq("id", replyId)
    .select("id,comment_id,name,avatar,content,is_admin,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reply: data });
}

// DELETE /api/profiles/[id]/comments/[commentId]/replies/[replyId] (삭제)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  const { replyId } = await params;

  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "").trim();
  const adminKey = String(body?.adminKey ?? "").trim();
  const isAdmin = isAdminKey(adminKey);

  if (!isAdmin && password.length < 4) {
    return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });
  }

  if (!isAdmin) {
    const { data: row, error: e0 } = await supabaseAdmin
      .from("profile_comment_replies")
      .select("pw_hash")
      .eq("id", replyId)
      .single();

    if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (row.pw_hash !== hashPw(password)) {
      return NextResponse.json({ error: "wrong password" }, { status: 401 });
    }
  }

  const { error } = await supabaseAdmin
    .from("profile_comment_replies")
    .delete()
    .eq("id", replyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
