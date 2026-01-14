import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry_id = id;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, password, content, adminKey } = body;

  if (!content?.trim()) return NextResponse.json({ error: "내용을 입력하세요" }, { status: 400 });

  const isAdmin = isAdminKey(adminKey);

  const finalName = (name ?? "").trim();
  const finalPw = isAdmin ? (password || "admin") : (password ?? "");  

  if (!finalName) return NextResponse.json({ error: "닉네임을 입력하세요" }, { status: 400 });
  if (!finalPw || finalPw.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상" }, { status: 400 });
  }

  const password_hash = await hashPw(finalPw);

  const { error } = await supabaseAdmin.from("guestbook_replies").insert({
    entry_id,
    name: finalName,
    content,
    password_hash,
    is_admin: isAdmin,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
