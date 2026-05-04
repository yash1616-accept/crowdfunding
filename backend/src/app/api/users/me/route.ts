import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const email = req.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();
    const user = await User.findOne({ email });
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'System fault' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, email, skills, availability } = data; // Usually clerk id maps to userId, or we use email

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
    }

    await connectToDatabase();

    // Upsert the user profile
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $set: { 
          skills: skills || [],
          availability: availability || 0,
          // If the user doesn't exist, we might want to create them. 
          // The model uses passwordHash as required, which means we might need a dummy or the real one.
          // Let's rely on the fact that if they exist, we update. 
        } 
      },
      { new: true, upsert: false } // We won't upsert because passwordHash is required
    );

    if (!user) {
      // If user doesn't exist, this means the auth system hasn't created the user record yet.
      // We will create it with a dummy passwordHash for now if it doesn't exist.
      const newUser = new User({
        email,
        passwordHash: 'clerk-auth', // Placeholder
        skills: skills || [],
        availability: availability || 0,
      });
      await newUser.save();
      return NextResponse.json({ message: 'User profile created', user: newUser }, { status: 201 });
    }

    return NextResponse.json({ message: 'User profile updated', user }, { status: 200 });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json({ error: 'System fault on user profile update' }, { status: 500 });
  }
}
