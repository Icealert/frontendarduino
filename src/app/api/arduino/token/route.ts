import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Arduino IoT Cloud credentials' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api2.arduino.cc/iot/v1/clients/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: 'https://api2.arduino.cc/iot'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to get access token: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to get access token: ${error.message}` },
      { status: 500 }
    );
  }
} 