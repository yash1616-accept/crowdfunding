import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    const { userId, username, skill, hoursPledged, estimatedValue } = data;

    if (!userId || !username || !skill || !hoursPledged || !estimatedValue) {
      return NextResponse.json({ error: 'Missing skill investment payload' }, { status: 400 });
    }

    await connectToDatabase();

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign target invalid' }, { status: 404 });
    }

    const newSkillBacker = {
      userId,
      username,
      skill,
      hoursPledged,
      estimatedValue,
      status: 'Pending',
      date: new Date()
    };

    // Ensure skillBackers array exists (for older campaigns)
    if (!campaign.skillBackers) {
      campaign.skillBackers = [];
    }

    // @ts-ignore
    campaign.skillBackers.push(newSkillBacker);
    await campaign.save();

    return NextResponse.json({ message: 'Skill investment pending validation', campaign }, { status: 200 });
  } catch (error) {
    console.error('Skill investment failed:', error);
    return NextResponse.json({ error: 'System fault on skill investment' }, { status: 500 });
  }
}
