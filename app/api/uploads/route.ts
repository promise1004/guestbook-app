import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string) || "profiles"; // profiles | comments 등

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 6MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const path = `${safeFolder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabaseAdmin.storage
      .from("guestbook-images")
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data } = supabaseAdmin.storage.from("guestbook-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "upload failed" }, { status: 500 });
  }
}
