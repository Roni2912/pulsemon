import { NextRequest, NextResponse } from "next/server";

// GET /api/status-pages - List status pages
export async function GET(request: NextRequest) {
  // TODO: Implement - fetch status pages from Supabase
  return NextResponse.json({ data: [], message: "Not implemented" }, { status: 501 });
}

// POST /api/status-pages - Create a status page
export async function POST(request: NextRequest) {
  // TODO: Implement - create status page in Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
