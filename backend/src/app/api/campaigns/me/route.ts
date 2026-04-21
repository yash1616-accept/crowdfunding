import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function GET(req: Request) {
  try {
    const creatorId = req.headers.get('x-user-id');
    
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized. Missing Creator Identity.' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Return campaigns matching the creatorId
    const campaigns = await Campaign.find({ creatorId }).sort({ createdAt: -1 });

    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error('Failed to retrieve private campaigns', error);
    return NextResponse.json({ error: 'System fault on campaign retrieval' }, { status: 500 });
  }
}
