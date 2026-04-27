import { NextResponse } from 'next/server';

/**
 * This route is deprecated. The platform has migrated to Razorpay.
 * Use /api/campaigns/[id]/razorpay-order and /api/campaigns/[id]/razorpay-verify instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /razorpay-order instead.' },
    { status: 410 }
  );
}
