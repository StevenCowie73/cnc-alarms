import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Alarm = { code: string; [k: string]: any };

const FILE = path.resolve("app/api/alarms/data/alarms-2-normalized.json");
let cache: Alarm[] | null = null;

async function load(): Promise<Alarm[]> {
  if (cache) return cache;
  const raw = await fs.readFile(FILE, "utf-8");
  const data = JSON.parse(raw);
  cache = Array.isArray(data) ? data : (data.alarms || []);
  cache = cache.map(a => ({ ...a, code: String(a.code).trim() }));
  return cache;
}

type Ctx = { params: { code: string } };

export async function GET(_req: Request, ctx: Ctx) {
  const code = String(ctx.params.code || "").trim().toUpperCase();
  const alarms = await load();
  const found = alarms.find(a => a.code.toUpperCase() === code);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(found);
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
