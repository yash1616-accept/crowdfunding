import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Await is required in Next 15+
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, backerUsername } = body;

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

    campaign.currentFunding += amount;
    campaign.backers.push({ username: backerUsername, amount, date: new Date() });
    
    // Check if funded
    if (campaign.currentFunding >= campaign.fundingGoal && campaign.status === 'Active') {
      campaign.status = 'Funded';
    }

    await campaign.save();

    return NextResponse.json({ message: 'Funding successful', campaign }, { status: 200 });
  } catch (error) {
    console.error('Funding failed:', error);
    return NextResponse.json({ error: 'System fault during funding process' }, { status: 500 });
  }
}
