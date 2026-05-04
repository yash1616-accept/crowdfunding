import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function GET() {
  try {
    await connectToDatabase();
    // Return all active campaigns, populating core creator attributes
    const campaigns = await Campaign.find({ status: { $ne: 'Draft' } }).populate('creatorId', 'email trustScore');
    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error('Failed to retrieve campaigns', error);
    return NextResponse.json({ error: 'System fault on campaign retrieval' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { creatorId, creatorName, contactEmail, category, requiredSkills, hook, blueprint, fundingGoal, milestones, stretchGoals, status } = data;

    if (!creatorId || !creatorName || !hook || !blueprint || !fundingGoal) {
      return NextResponse.json({ error: 'Missing core campaign schematics' }, { status: 400 });
    }

    await connectToDatabase();

    const newCampaign = new Campaign({
      creatorId,
      creatorName,
      contactEmail: contactEmail || '',
      category: category || 'Other',
      requiredSkills: requiredSkills || [],
      hook,
      blueprint,
      fundingGoal,
      status: status || 'Draft',
      milestones: milestones || [],
      stretchGoals: stretchGoals || []
    });

    await newCampaign.save();
    return NextResponse.json({ message: 'Campaign architecture deployed to Draft', campaign: newCampaign }, { status: 201 });
  } catch (error) {
    console.error('Campaign construction failed:', error);
    return NextResponse.json({ error: 'System fault on campaign deployment' }, { status: 500 });
  }
}
