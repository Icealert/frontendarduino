export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    // Check both formats of environment variables
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
    NEXT_PUBLIC_ARDUINO_CLIENT_ID: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID,
    NEXT_PUBLIC_ARDUINO_CLIENT_SECRET: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  console.log('TEST route env:', {
    ...envVars,
    // Add lengths for debugging
    client_id_length: process.env.client_id?.length,
    client_secret_length: process.env.client_secret?.length,
    NEXT_PUBLIC_ARDUINO_CLIENT_ID_length: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID?.length,
    NEXT_PUBLIC_ARDUINO_CLIENT_SECRET_length: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET?.length,
  });

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    has_client_id: !!process.env.client_id,
    has_client_secret: !!process.env.client_secret,
    has_next_public_client_id: !!process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID,
    has_next_public_client_secret: !!process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET,
    // Include lengths but not actual values
    client_id_length: process.env.client_id?.length,
    client_secret_length: process.env.client_secret?.length,
    next_public_client_id_length: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID?.length,
    next_public_client_secret_length: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET?.length,
  });
} 