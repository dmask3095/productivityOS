import { NextResponse } from 'next/server';
import { initSchema } from '@/lib/db';

export async function GET() {
  try {
    await initSchema();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
