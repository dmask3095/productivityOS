import { NextRequest, NextResponse } from 'next/server';

// Auth is handled per-route via requireAuth() in API routes
// and via client-side redirect in page components
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
