import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

// POST /api/profiles/[id]/comments/[commentId]/replies/[replyId]/verify
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  try {
    const { replyId } = await params;

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? "").trim();
    const adminKey = String(body?.adminKey ?? "").trim();
    const isAdmin = isAdminKey(adminKey);

    // 관리자면 verify 없이 통과
    if (isAdmin) return NextResponse.json({ ok: true });

    if (password.length < 4) {
      return NextResponse.json({ error: "password must be 4+ chars" }, { status: 400 });
    }

    const pw_hash = hashPw(password);

    const { data: row, error } = await supabaseAdmin
      .from("profile_comment_replies")
      .select("id,pw_hash,is_admin")
      .eq("id", replyId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.is_admin) return NextResponse.json({ error: "관리자 답글은 본인확인 대상이 아니에요" }, { status: 400 });

    if (!row.pw_hash || row.pw_hash !== pw_hash) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
