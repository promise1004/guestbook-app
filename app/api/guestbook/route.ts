import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

// ✅ 목록 조회: GET /api/guestbook?sort=new|old
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sort = url.searchParams.get("sort") || "new";

    const ascending = sort === "old";

    // entries 불러오기
    const { data: entries, error: e1 } = await supabaseAdmin
      .from("guestbook_entries")
      .select("id,name,avatar,content,created_at")
      .order("created_at", { ascending });

    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    // replies 불러오기
    const entryIds = (entries ?? []).map((e) => e.id);
    let replies: any[] = [];

    if (entryIds.length > 0) {
      const { data: r, error: e2 } = await supabaseAdmin
        .from("guestbook_replies")
        .select("id,entry_id,name,content,created_at,is_admin")
        .in("entry_id", entryIds)
        .order("created_at", { ascending: true });

      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      replies = r ?? [];
    }

    // 합치기
    const replyMap = new Map<string, any[]>();
    for (const r of replies) {
      const arr = replyMap.get(r.entry_id) ?? [];
      arr.push(r);
      replyMap.set(r.entry_id, arr);
    }

    const merged = (entries ?? []).map((e) => ({
      ...e,
      replies: replyMap.get(e.id) ?? [],
    }));

    return NextResponse.json({ entries: merged });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// ✅ 글 작성: POST /api/guestbook
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const name = String(body.name ?? "").trim();
    const avatar = String(body.avatar ?? "🙂").trim();
    const content = String(body.content ?? "").trim();
    const password = String(body.password ?? "").trim();
    const adminKey = String(body.adminKey ?? "").trim();

    if (!name) return NextResponse.json({ error: "닉네임을 입력하세요." }, { status: 400 });
    if (!content) return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400 });

    const admin = isAdminKey(adminKey);

    // 일반 사용자는 비번 필수
    let password_hash: string | null = null;
    if (!admin) {
      if (password.length < 4) {
        return NextResponse.json({ error: "비밀번호는 4자 이상 입력하세요." }, { status: 400 });
      }
      password_hash = await hashPw(password);
    } else {
      // 관리자는 비번 없이도 작성 가능(원하면 여기서도 hash 만들 수 있음)
      password_hash = await hashPw(password || "admin");
    }

    const { error } = await supabaseAdmin.from("guestbook_entries").insert({
      name,
      avatar,
      content,
      password_hash,
      is_admin: admin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
