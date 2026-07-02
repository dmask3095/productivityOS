import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initSchema } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const [user] = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = Number(user.id);
    session.email = user.email as string;
    session.name = user.name as string;
    await session.save();
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
