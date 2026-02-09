import { NextRequest, NextResponse } from "next/server";

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  // TODO: Implement - verify signature, handle checkout.session.completed,
  // customer.subscription.updated, customer.subscription.deleted, etc.
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
