import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

// PATCH /api/profiles/[id]/comments/[commentId]/replies/[replyId] (수정)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  try {
    const { replyId } = await params;

    const body = await req.json().catch(() => ({}));
    const content = String(body?.content ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const adminKey = String(body?.adminKey ?? "").trim();
    const isAdmin = isAdminKey(adminKey);

    if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

    // 관리자면 바로 수정
    if (isAdmin) {
      const { data, error } = await supabaseAdmin
        .from("profile_comment_replies")
        .update({ content })
        .eq("id", replyId)
        .select("id,comment_id,name,avatar,content,is_admin,created_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ reply: data });
    }

    // 일반 유저: 비번 검증 필요
    if (password.length < 4) {
      return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });
    }

    const pw_hash = hashPw(password);

    const { data: row, error: rerr } = await supabaseAdmin
      .from("profile_comment_replies")
      .select("id,pw_hash,is_admin")
      .eq("id", replyId)
      .single();

    if (rerr) return NextResponse.json({ error: rerr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.is_admin) return NextResponse.json({ error: "관리자 답글은 관리자만 수정할 수 있어요" }, { status: 403 });

    if (!row.pw_hash || row.pw_hash !== pw_hash) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("profile_comment_replies")
      .update({ content })
      .eq("id", replyId)
      .select("id,comment_id,name,avatar,content,is_admin,created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reply: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}

// DELETE /api/profiles/[id]/comments/[commentId]/replies/[replyId] (삭제)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  try {
    const { replyId } = await params;

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? "").trim();
    const adminKey = String(body?.adminKey ?? "").trim();
    const isAdmin = isAdminKey(adminKey);

    // 관리자면 바로 삭제
    if (isAdmin) {
      const { error } = await supabaseAdmin.from("profile_comment_replies").delete().eq("id", replyId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // 일반 유저: 비번 검증
    if (password.length < 4) {
      return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });
    }
    const pw_hash = hashPw(password);

    const { data: row, error: rerr } = await supabaseAdmin
      .from("profile_comment_replies")
      .select("id,pw_hash,is_admin")
      .eq("id", replyId)
      .single();

    if (rerr) return NextResponse.json({ error: rerr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.is_admin) return NextResponse.json({ error: "관리자 답글은 관리자만 삭제할 수 있어요" }, { status: 403 });

    if (!row.pw_hash || row.pw_hash !== pw_hash) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 401 });
    }

    const { error } = await supabaseAdmin.from("profile_comment_replies").delete().eq("id", replyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
