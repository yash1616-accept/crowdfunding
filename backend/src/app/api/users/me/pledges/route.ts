import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Missing User Identity.' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find all campaigns where this user is listed in skillBackers
    const campaigns = await Campaign.find({ 'skillBackers.userId': userId })
      .select('hook category skillBackers creatorName')
      .sort({ createdAt: -1 });

    // Format the response to be easy for the frontend to consume
    const pledges = campaigns.map(camp => {
      // Find the specific pledge made by this user in this campaign
      const userPledge = (camp.skillBackers || []).find((b: any) => b.userId === userId);
      return {
        campaignId: camp._id,
        campaignName: camp.hook,
        creatorName: camp.creatorName,
        category: camp.category,
        skill: userPledge?.skill,
        hoursPledged: userPledge?.hoursPledged,
        estimatedValue: userPledge?.estimatedValue,
        status: userPledge?.status,
        date: userPledge?.date
      };
    });

    return NextResponse.json({ pledges }, { status: 200 });
  } catch (error) {
    console.error('Failed to retrieve skill pledges', error);
    return NextResponse.json({ error: 'System fault on pledges retrieval' }, { status: 500 });
  }
}
