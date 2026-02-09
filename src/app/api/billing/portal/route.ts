import { NextRequest, NextResponse } from "next/server";

// POST /api/billing/portal - Create Stripe customer portal session
export async function POST(request: NextRequest) {
  // TODO: Implement - create Stripe portal session
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
