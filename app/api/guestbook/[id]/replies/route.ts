import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminKey } from "@/lib/admin";
import { hashPw } from "@/lib/pw";
import { randomUUID } from "crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://promise.page24.app",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
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

    console.log("✅ HIT replies GET", entryId); // ✅ 여기

    const { data, error } = await supabaseAdmin
      .from("guestbook_replies")
      .select("id, entry_id, name, content, created_at, is_admin, image_url")
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await ctx.params;

    console.log("✅ HIT replies POST", entryId); // ✅ 여기

    const form = await req.formData();

    const name = String(form.get("name") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    const adminKey = String(form.get("adminKey") ?? "").trim();
    const is_admin = isAdminKey(adminKey);

    const file = form.get("image") as File | null;
    console.log("🧾 form keys =", Array.from(form.keys()));
console.log("🖼️ file =", file ? { name: file.name, type: file.type, size: file.size } : null);

    if (!name)
      return NextResponse.json({ error: "닉네임을 입력하세요." }, { status: 400, headers: CORS_HEADERS });
    if (!content)
      return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400, headers: CORS_HEADERS });

    // 관리자면 비번 없어도 통과, 아니면 4자리 이상
    let password_hash: string | null = null;
    if (!is_admin) {
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

    // ✅ (옵션) 이미지 업로드
    let image_url: string | null = null;

    if (file && typeof file === "object" && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "이미지 파일만 업로드 가능합니다." },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const MAX = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX) {
        return NextResponse.json(
          { error: "이미지는 5MB 이하만 업로드 가능합니다." },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const extRaw = (file.name.split(".").pop() || "png").toLowerCase();
      const ext = extRaw.replace(/[^a-z0-9]/g, "") || "png";
      const path = `replies/${entryId}/${randomUUID()}.${ext}`;

      const BUCKET = "guestbook-images"; // ✅ 너 버킷명 맞으면 그대로
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "3600",
        });

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500, headers: CORS_HEADERS });
      }

      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      image_url = data.publicUrl;
    }

    const { error } = await supabaseAdmin.from("guestbook_replies").insert({
      entry_id: entryId,
      name,
      content,
      password_hash,
      is_admin,
      image_url, // ✅ 추가
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
