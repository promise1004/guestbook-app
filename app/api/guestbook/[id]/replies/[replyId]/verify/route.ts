import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  const { id: entryId, replyId } = await params;

const body = await req.json().catch(() => ({} as any));

  const password = String(body.password ?? "").trim();
  const adminKey = body.adminKey as string | undefined;

  // 관리자는 인증 없이 OK
  if (isAdminKey(adminKey)) return NextResponse.json({ ok: true });

  if (!password || password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상" }, { status: 400 });
  }

  const { data: reply, error: rErr } = await supabaseAdmin
    .from("guestbook_replies")
    .select("id, entry_id, password_hash")
    .eq("id", replyId)
    .single();

  if (rErr || !reply) {
    return NextResponse.json({ error: "답글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (reply.entry_id !== entryId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const ok = await verifyPw(password, reply.password_hash);
  if (!ok) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });

  return NextResponse.json({ ok: true });
}
