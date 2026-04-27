import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia', // Or your target stripe version
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, backerUsername, tierLabel } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid funding amount' }, { status: 400 });
    }
    
    if (!backerUsername) {
      return NextResponse.json({ error: 'Backer identity (username) is required' }, { status: 400 });
    }

    await connectToDatabase();
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Since this is a test/development environment, we'll build the checkout session.
    // If you don't have STRIPE_SECRET_KEY set up correctly, this will fail in Stripe,
    // so we wrap it in a try-catch for Stripe specifically.
    
    // Determine the base URL for the return
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    try {
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_STRIPE_SECRET_KEY_HERE')) {
        // Mock Stripe return if keys are not set yet
        console.warn('Stripe keys not set. Simulating a checkout session.');
        return NextResponse.json({
          url: `${origin}/explore?session_id=mock_session_${Date.now()}&success=true&campaign_id=${id}&amount=${amount}&backerUsername=${backerUsername}`
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Investment in ${campaign.hook.substring(0, 50)}...`,
                description: `Tier: ${tierLabel || 'Custom'}`,
              },
              unit_amount: amount * 100, // Stripe expects amounts in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/explore?session_id={CHECKOUT_SESSION_ID}&success=true&campaign_id=${id}`,
        cancel_url: `${origin}/explore?canceled=true`,
        metadata: {
          campaignId: id,
          backerUsername: backerUsername,
          amount: amount.toString(),
        },
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json({ error: stripeError.message }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Checkout creation failed:', error);
    return NextResponse.json({ error: 'System fault during checkout initialization' }, { status: 500 });
  }
}
