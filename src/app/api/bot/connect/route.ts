import { NextRequest, NextResponse } from 'next/server';

// Global bot instance
let botInstance: any = null;
let botStatus = {
  connected: false,
  phoneNumber: '',
  pairingCode: '',
  lastActivity: new Date().toISOString(),
  messagesCount: 0
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ...botStatus
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get bot status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, usePairingCode } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Import the bot connector dynamically to avoid server-side issues
    const { connectBot } = await import('@/lib/bot-connector');
    
    const result = await connectBot(phoneNumber, usePairingCode);
    
    if (result.success) {
      botInstance = result.bot;
      botStatus = {
        connected: true,
        phoneNumber: phoneNumber,
        pairingCode: result.pairingCode || '',
        lastActivity: new Date().toISOString(),
        messagesCount: botStatus.messagesCount
      };
      
      return NextResponse.json({
        success: true,
        pairingCode: result.pairingCode
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect bot' },
      { status: 500 }
    );
  }
}