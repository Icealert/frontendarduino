export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('TEST route env:', {
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
  });
  return NextResponse.json({
    client_id: !!process.env.client_id,
    client_secret: !!process.env.client_secret,
  });
} 