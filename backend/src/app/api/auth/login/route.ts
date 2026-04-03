import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'eadedde1d55745e09e7cd81f2621dfc1a2d1c9aafd183873d2bbe5098aba6e0925ac0520e326189019d1fa47b6658a28cd2f26008e67cd91e4957cef4b5a5cd8';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing login coordinates' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Identity not found in matrix' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Access denied: Invalid signatures' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({ message: 'Access granted', role: user.role });

    // High-security server-only cookie implementation
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours lock
    });

    return response;
  } catch (error) {
    console.error('Login process fatal flaw', error);
    return NextResponse.json({ error: 'System fault during authentication' }, { status: 500 });
  }
}
