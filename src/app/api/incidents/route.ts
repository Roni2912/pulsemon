import { NextRequest, NextResponse } from "next/server";

// GET /api/incidents - List incidents for authenticated user
export async function GET(request: NextRequest) {
  // TODO: Implement - fetch incidents from Supabase with pagination
  return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50, hasMore: false }, { status: 501 });
}
