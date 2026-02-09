import { NextRequest, NextResponse } from "next/server";

// POST /api/cron/check-monitors - Run monitor checks (called by cron)
export async function POST(request: NextRequest) {
  // TODO: Implement - fetch all active monitors, run checks, record results, trigger alerts
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
