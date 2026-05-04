import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    const { skillBackerId, action } = data; // action should be 'Approve' or 'Reject'

    if (!skillBackerId || !['Approve', 'Reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid validation payload' }, { status: 400 });
    }

    await connectToDatabase();

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign target invalid' }, { status: 404 });
    }

    // @ts-ignore
    const backer = campaign.skillBackers.id(skillBackerId);
    if (!backer) {
      return NextResponse.json({ error: 'Skill backer record not found' }, { status: 404 });
    }

    backer.status = action === 'Approve' ? 'Approved' : 'Rejected';

    // If approved, add the estimated value to the campaign's current funding?
    // This depends on whether we want to mix skill value with monetary value.
    // Let's add it to a separate "skill value" or just add to currentFunding for now as simulation.
    // Actually, let's keep them separate to maintain "all existing stuff" intact.
    // Wait, let's just update the status, and the frontend can compute total skill value.
    
    await campaign.save();

    return NextResponse.json({ message: `Skill investment ${action.toLowerCase()}d`, campaign }, { status: 200 });
  } catch (error) {
    console.error('Skill validation failed:', error);
    return NextResponse.json({ error: 'System fault on skill validation' }, { status: 500 });
  }
}
