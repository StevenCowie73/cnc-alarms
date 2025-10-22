import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type Alarm = { code: string; name?: string; [k: string]: any };

const FILE = path.resolve("app/api/alarms/data/alarms-2-normalized.json");
let cache: Alarm[] | null = null;

async function load(): Promise<Alarm[]> {
  if (cache) return cache;
  const raw = await fs.readFile(FILE, "utf-8");
  const data = JSON.parse(raw);
  cache = Array.isArray(data) ? data : data.alarms || [];
  cache = cache.map(a => ({ ...a, code: String(a.code).trim() }));
  return cache;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") ?? 10)));

  const alarms = await load();
  const start = Math.max(0, offset);
  const end = Math.min(alarms.length, start + limit);

  return NextResponse.json({
    items: alarms.slice(start, end),
    total: alarms.length,
    nextOffset: end < alarms.length ? end : null,
  });
}
