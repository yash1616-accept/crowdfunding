import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, backerUsername, isMock } = body;

    // Handle Mock Mode
    if (isMock) {
      console.warn('Handling mock verification.');
      await connectToDatabase();
      const campaign = await Campaign.findById(id);
      if (campaign) {
        campaign.currentFunding += amount;
        campaign.backers.push({ username: backerUsername, amount, date: new Date() });
        if (campaign.currentFunding >= campaign.fundingGoal && campaign.status === 'Active') {
          campaign.status = 'Funded';
        }
        await campaign.save();
      }
      return NextResponse.json({ success: true, message: 'Mock payment verified' });
    }

    // Production Verification
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing Razorpay parameters' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('Razorpay secret not configured.');

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Signature verification failed. Payment might be tampered.' }, { status: 400 });
    }

    // Signature matches, complete the funding logic
    await connectToDatabase();
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    campaign.currentFunding += amount;
    campaign.backers.push({ username: backerUsername, amount, date: new Date() });
    
    if (campaign.currentFunding >= campaign.fundingGoal && campaign.status === 'Active') {
      campaign.status = 'Funded';
    }

    await campaign.save();
    return NextResponse.json({ success: true, message: 'Payment verified and ledger updated' });

  } catch (error: any) {
    console.error('Razorpay verification failed:', error);
    return NextResponse.json({ error: 'System fault during verification' }, { status: 500 });
  }
}
