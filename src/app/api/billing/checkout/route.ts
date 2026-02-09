import { NextRequest, NextResponse } from "next/server";

// POST /api/billing/checkout - Create Stripe checkout session
export async function POST(request: NextRequest) {
  // TODO: Implement - create Stripe checkout session
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
