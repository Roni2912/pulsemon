import { NextRequest, NextResponse } from "next/server";

// GET /api/checks?monitorId=xxx - Get checks for a monitor
export async function GET(request: NextRequest) {
  // TODO: Implement - fetch checks from Supabase with pagination
  return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50, hasMore: false }, { status: 501 });
}
