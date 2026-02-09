import { NextRequest, NextResponse } from "next/server";

// GET /api/monitors/[id] - Get single monitor with checks
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Implement - fetch monitor by ID from Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

// PATCH /api/monitors/[id] - Update monitor
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Implement - update monitor in Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

// DELETE /api/monitors/[id] - Delete monitor
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Implement - delete monitor from Supabase
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
