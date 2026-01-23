import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

/* =========================
   ✅ CORS (파일 최상단)
========================= */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://promise.page24.app",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
"Access-Control-Max-Age": "86400",

};

/* =========================
   ✅ OPTIONS (파일 최상단)
========================= */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ✅ 목록 조회: GET /api/guestbook?sort=new|old&page=1&limit=5
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sort = url.searchParams.get("sort") || "new";
    const ascending = sort === "old";

    // ✅ 페이지/개수 파라미터 (기본: 1페이지, 5개)
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "5")));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ✅ 전체 개수(페이지네이션용)
    const { count, error: cErr } = await supabaseAdmin
      .from("guestbook_entries")
      .select("*", { count: "exact", head: true });

    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500, headers: CORS_HEADERS });
    }

    // ✅ entries: 해당 페이지 범위만 가져오기
    const { data: entries, error: e1 } = await supabaseAdmin
      .from("guestbook_entries")
      .select("id,name,avatar,content,image_url,created_at")
      .order("created_at", { ascending })
      .range(from, to);

    if (e1) {
      return NextResponse.json({ error: e1.message }, { status: 500, headers: CORS_HEADERS });
    }

    // ✅ replies: 현재 페이지의 entry들에 대해서만 가져오기
    const entryIds = (entries ?? []).map((e) => e.id);
    let replies: any[] = [];

    if (entryIds.length > 0) {
      const { data: r, error: e2 } = await supabaseAdmin
        .from("guestbook_replies")
        .select("id,entry_id,name,content,created_at,is_admin,image_url")
        .in("entry_id", entryIds)
        .order("created_at", { ascending: true });

      if (e2) {
        return NextResponse.json({ error: e2.message }, { status: 500, headers: CORS_HEADERS });
      }
      replies = r ?? [];
    }

    // ✅ 합치기
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

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      { entries: merged, page, limit, total, totalPages },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ✅ 글 작성: POST /api/guestbook
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
    }

    const name = String(body.name ?? "").trim();
    const avatar = String(body.avatar ?? "🙂").trim();
    const content = String(body.content ?? "").trim();
    const password = String(body.password ?? "").trim();
    const adminKey = String(body.adminKey ?? "").trim();

    const image_url =
      body.image_url && String(body.image_url).trim().length > 0
        ? String(body.image_url).trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "닉네임을 입력하세요." }, { status: 400, headers: CORS_HEADERS });
    }
    if (!content) {
      return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400, headers: CORS_HEADERS });
    }

    const admin = isAdminKey(adminKey);

    let password_hash: string | null = null;
    if (!admin) {
      if (password.length < 4) {
        return NextResponse.json(
          { error: "비밀번호는 4자 이상 입력하세요." },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      password_hash = await hashPw(password);
    } else {
      password_hash = await hashPw(password || "admin");
    }

    const { error } = await supabaseAdmin.from("guestbook_entries").insert({
      name,
      avatar,
      content,
      image_url,
      password_hash,
      is_admin: admin,
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
