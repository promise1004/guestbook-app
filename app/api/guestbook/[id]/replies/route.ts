import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string; replyId: string }> }
) {
  const { id: entryId, replyId } = await ctx.params;

  const body = await req.json().catch(() => ({} as any));

  const content = String(body.content ?? "").trim();
  const password = String((body as any).password ?? "").trim();
const adminKey = String((body as any).adminKey ?? "").trim();
  const admin = isAdminKey(adminKey);

  if (!content) return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400 });

  const { data: row, error: e1 } = await supabaseAdmin
    .from("guestbook_replies")
    .select("id,entry_id,password_hash")
    .eq("id", replyId)
    .single();

  if (e1 || !row) return NextResponse.json({ error: "대상을 찾을 수 없습니다." }, { status: 404 });
  if (row.entry_id !== entryId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  if (!admin) {
    if (password.length < 4) {
      return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 401 });
    }
    const ok = await verifyPw(password, row.password_hash);
    if (!ok) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 403 });
  }

  const { error: e2 } = await supabaseAdmin
    .from("guestbook_replies")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", replyId);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string; replyId: string }> }
) {
  const { id: entryId, replyId } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const password = String(body.password ?? "").trim();
  const adminKey = String(body.adminKey ?? "").trim();
  const admin = isAdminKey(adminKey);

  const { data: row, error: e1 } = await supabaseAdmin
    .from("guestbook_replies")
    .select("id,entry_id,password_hash")
    .eq("id", replyId)
    .single();

  if (e1 || !row) return NextResponse.json({ error: "대상을 찾을 수 없습니다." }, { status: 404 });
  if (row.entry_id !== entryId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  if (!admin) {
    if (password.length < 4) {
      return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 401 });
    }
    const ok = await verifyPw(password, row.password_hash);
    if (!ok) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 403 });
  }

  const { error: e2 } = await supabaseAdmin.from("guestbook_replies").delete().eq("id", replyId);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}