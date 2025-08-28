import { NextResponse } from 'next/server';

// Global bot instance and status
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