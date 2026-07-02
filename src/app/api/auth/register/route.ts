import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initSchema } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { name, email, password } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${hash})
      RETURNING id, email, name
    `;
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = Number(user.id);
    session.email = user.email as string;
    session.name = user.name as string;
    await session.save();
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
