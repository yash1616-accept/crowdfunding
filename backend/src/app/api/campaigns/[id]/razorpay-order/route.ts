import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, backerUsername } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid funding amount' }, { status: 400 });
    }
    
    if (!backerUsername) {
      return NextResponse.json({ error: 'Backer identity is required' }, { status: 400 });
    }

    await connectToDatabase();
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Mock Mode Support if keys aren't configured
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOUR_RAZORPAY')) {
      console.warn('Razorpay keys not set. Generating a mock order ID.');
      return NextResponse.json({
        id: `order_mock_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
        isMock: true
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });

    const options = {
      amount: amount * 100, // smallest unit for INR is paise
      currency: 'INR',
      receipt: `rcpt_${id.substring(0, 8)}_${Date.now()}`,
      notes: {
        campaignId: id,
        backerUsername,
      }
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);

  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json({ error: 'System fault during checkout initialization' }, { status: 500 });
  }
}
