import { NextRequest, NextResponse } from "next/server";

// GET /api/monitors - List all monitors for authenticated user
export async function GET(request: NextRequest) {
  // TODO: Implement - fetch monitors from Supabase
  return NextResponse.json({ data: [], message: "Not implemented" }, { status: 501 });
}

// POST /api/monitors - Create a new monitor
export async function POST(request: NextRequest) {
  // TODO: Implement - create monitor in Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
