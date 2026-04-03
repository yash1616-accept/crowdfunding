import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing critical parameters' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Identity already deployed in system' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      passwordHash,
      role: role || 'Backer',
      trustScore: 100 // Default baseline trust
    });

    await newUser.save();

    return NextResponse.json({ message: 'Identity successfully constructed', userId: newUser._id }, { status: 201 });
  } catch (error) {
    console.error('Registration framework critical failure', error);
    return NextResponse.json({ error: 'Internal system fault' }, { status: 500 });
  }
}
