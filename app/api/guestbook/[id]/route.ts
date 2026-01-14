import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { password, content, adminKey } = body;

  if (!content?.trim()) return NextResponse.json({ error: "내용을 입력하세요" }, { status: 400 });

  // ✅ 관리자면 비번 검사 없이 수정
  if (isAdminKey(adminKey)) {
    const { error } = await supabaseAdmin
      .from("guestbook_entries")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 일반 유저: 비번 검증
  const { data: row, error: selErr } = await supabaseAdmin
    .from("guestbook_entries")
    .select("password_hash")
    .eq("id", id)
    .single();

  if (selErr || !row) return NextResponse.json({ error: "글을 찾을 수 없습니다" }, { status: 404 });

  const ok = await verifyPw(password ?? "", row.password_hash);
  if (!ok) return NextResponse.json({ error: "비밀번호가 틀렸습니다" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("guestbook_entries")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { password, adminKey } = body;

  // ✅ 관리자면 비번 검사 없이 삭제
  if (isAdminKey(adminKey)) {
    const { error } = await supabaseAdmin.from("guestbook_entries").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 일반 유저: 비번 검증
  const { data: row, error: selErr } = await supabaseAdmin
    .from("guestbook_entries")
    .select("password_hash")
    .eq("id", id)
    .single();

  if (selErr || !row) return NextResponse.json({ error: "글을 찾을 수 없습니다" }, { status: 404 });

  const ok = await verifyPw(password ?? "", row.password_hash);
  if (!ok) return NextResponse.json({ error: "비밀번호가 틀렸습니다" }, { status: 401 });

  const { error } = await supabaseAdmin.from("guestbook_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
