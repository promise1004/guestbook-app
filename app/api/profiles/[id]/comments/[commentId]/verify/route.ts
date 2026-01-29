import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: postId, commentId } = await params;

  const body = await req.json().catch(() => ({} as any));
  const password = String(body.password ?? "").trim();
  const adminKey = body.adminKey as string | undefined;

  // ✅ 관리자는 인증 없이 OK
  if (isAdminKey(adminKey)) return NextResponse.json({ ok: true });

  if (!password || password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상" }, { status: 400 });
  }

  // ✅ (핵심) 댓글을 id + post_id 로 찾기 (프로필 상세 id를 post_id로 쓰는 구조)
  const { data: c, error } = await supabaseAdmin
    .from("profile_comments") // ✅ 네 댓글 테이블명이 다르면 여기만 바꿔
    .select("*")
    .eq("id", commentId)
    .eq("post_id", postId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!c) {
    return NextResponse.json({ error: "댓글을 찾을 수 없어요" }, { status: 404 });
  }

  // ✅ 컬럼명 프로젝트마다 다를 수 있어서 후보로 다 받음
  const hash =
    (c as any).password_hash ??
    (c as any).pw_hash ??
    (c as any).password ??
    (c as any).pw ??
    null;

  if (!hash) {
    return NextResponse.json(
      { error: "비밀번호 컬럼을 찾을 수 없어요 (password_hash/pw_hash/password/pw 중 하나 필요)" },
      { status: 500 }
    );
  }

  // ✅ 해시(보통 bcrypt)면 verifyPw로 검증, 아니면 문자열 비교(혹시 평문 저장이면)
  const looksHashed = typeof hash === "string" && hash.startsWith("$2");
  const ok = looksHashed ? await verifyPw(password, hash) : String(hash) === password;

  if (!ok) {
    return NextResponse.json({ error: "비밀번호가 틀렸어요" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
