import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const campaign = await Campaign.findById(id).populate('creatorId', 'email trustScore');
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found in matrix' }, { status: 404 });
    }
    return NextResponse.json({ campaign }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'System fault retrieving campaign payload' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    await connectToDatabase();

    const updated = await Campaign.findByIdAndUpdate(id, { $set: data }, { new: true });
    
    if (!updated) {
      return NextResponse.json({ error: 'Campaign target invalid' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Campaign metrics updated', campaign: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'System fault on campaign updating' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const result = await Campaign.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json({ error: 'Campaign target invalid' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Campaign purged from system' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'System fault on campaign purge' }, { status: 500 });
  }
}
