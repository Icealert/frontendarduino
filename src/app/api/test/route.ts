import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Arduino credentials' },
        { status: 400 }
      );
    }

    // Create form data for authentication
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('audience', 'https://api2.arduino.cc/iot');

    // Try to get an access token
    const response = await fetch('https://api2.arduino.cc/iot/v1/clients/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to authenticate' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully authenticated with Arduino IoT Cloud',
      tokenInfo: {
        hasToken: !!data.access_token,
        expiresIn: data.expires_in
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 