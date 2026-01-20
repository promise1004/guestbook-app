import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminKey } from "@/lib/admin";
import { hashPw } from "@/lib/pw";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://promise.page24.app",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * 댓글 목록
 * GET /api/guestbook/[id]/replies
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await ctx.params;

    const { data, error } = await supabaseAdmin
      .from("guestbook_replies")
      .select("id,entry_id,name,content,created_at,is_admin")
      .eq("entry_id", entryId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ replies: data ?? [] }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * 댓글 작성
 * POST /api/guestbook/[id]/replies
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await ctx.params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
    }

    const name = String(body.name ?? "").trim();
    const content = String(body.content ?? "").trim();
    const password = String(body.password ?? "").trim();
    const adminKey = String(body.adminKey ?? "").trim();
    const is_admin = isAdminKey(adminKey);

    if (!name) return NextResponse.json({ error: "닉네임을 입력하세요." }, { status: 400, headers: CORS_HEADERS });
    if (!content) return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400, headers: CORS_HEADERS });

    // 관리자면 비번 없어도 통과, 아니면 4자리 이상
    let password_hash: string | null = null;
    if (!is_admin) {
      if (password.length < 4) {
        return NextResponse.json({ error: "비밀번호는 4자 이상 입력하세요." }, { status: 400, headers: CORS_HEADERS });
      }
      password_hash = await hashPw(password);
    } else {
      password_hash = await hashPw(password || "admin");
    }

    const { error } = await supabaseAdmin.from("guestbook_replies").insert({
      entry_id: entryId,
      name,
      content,
      password_hash,
      is_admin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
