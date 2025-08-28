import { NextRequest, NextResponse } from 'next/server';

// Global bot instance and status
let botInstance: any = null;
let botStatus = {
  connected: false,
  phoneNumber: '',
  pairingCode: '',
  lastActivity: new Date().toISOString(),
  messagesCount: 0
};

export async function POST() {
  try {
    if (botInstance) {
      // Import the bot connector dynamically
      const { disconnectBot } = await import('@/lib/bot-connector');
      await disconnectBot(botInstance);
      botInstance = null;
    }
    
    botStatus = {
      connected: false,
      phoneNumber: '',
      pairingCode: '',
      lastActivity: new Date().toISOString(),
      messagesCount: botStatus.messagesCount
    };
    
    return NextResponse.json({
      success: true,
      message: 'Bot disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect bot' },
      { status: 500 }
    );
  }
}