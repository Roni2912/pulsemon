import { NextRequest, NextResponse } from "next/server";

// GET /api/settings/alerts - Get alert settings
export async function GET(request: NextRequest) {
  // TODO: Implement - fetch alert settings from Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

// PATCH /api/settings/alerts - Update alert settings
export async function PATCH(request: NextRequest) {
  // TODO: Implement - update alert settings in Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
