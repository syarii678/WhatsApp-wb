import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';
import { BotUtils } from './bot-utils';

// Global configuration
const globalConfig = {
  bot: {
    prefix: '!',
    number: '', // Owner number for validation
    numbers: [], // Array of allowed numbers
    commands: []
  },
  owner: {
    name: 'Bot Owner',
    number: '1234567890' // Default owner number
  }
};

// Bot instance storage
let botInstance: any = null;
let connectionPromise: Promise<any> | null = null;
let currentSession: any = null;

interface BotConnectionResult {
  success: boolean;
  bot?: any;
  pairingCode?: string;
  error?: string;
}

export async function connectBot(phoneNumber: string, usePairingCode: boolean = true): Promise<BotConnectionResult> {
  try {
    // Validate phone number
    if (!BotUtils.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // If there's already a connection in progress, wait for it
    if (connectionPromise) {
      await connectionPromise;
    }

    // Check if there's an existing session
    const existingSession = await BotUtils.getSession(phoneNumber);
    if (existingSession && existingSession.isConnected) {
      return {
        success: false,
        error: 'Bot is already connected with this number'
      };
    }

    // Create a new connection promise
    connectionPromise = (async () => {
      const sessionId = BotUtils.generateSessionId();
      const sessionDir = path.join(process.cwd(), 'sessions', sessionId);
      
      // Ensure session directory exists
      try {
        await fs.mkdir(sessionDir, { recursive: true });
      } catch (error) {
        console.log('Session directory already exists or cannot be created');
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      const { version } = await fetchLatestBaileysVersion();

      const bot = makeWASocket({
        version,
        printQRInTerminal: !usePairingCode,
        auth: state,
        logger: pino({ level: 'silent' }).child({ level: 'silent' }),
        shouldIgnoreJid: (jid: string) => jid && jid.endsWith('@newsletter')
      });

      // Create or update session in database
      if (!existingSession) {
        currentSession = await BotUtils.createSession(phoneNumber, sessionId);
      } else {
        currentSession = await BotUtils.updateSession(phoneNumber, {
          sessionId,
          isConnected: false
        });
      }

      // Handle pairing code
      if (usePairingCode && !bot.user && !bot.authState.creds.registered) {
        const code = await bot.requestPairingCode(phoneNumber);
        console.log(`Pairing code generated: ${code}`);
        
        // Update session with pairing code
        await BotUtils.updateSession(phoneNumber, {
          pairingCode: code,
          lastActivity: new Date()
        });
        
        // Set up event listeners after pairing code is generated
        setupBotEvents(bot, saveCreds, phoneNumber);
        
        return {
          success: true,
          bot,
          pairingCode: code
        };
      }

      // Set up event listeners
      setupBotEvents(bot, saveCreds, phoneNumber);

      return {
        success: true,
        bot
      };
    })();

    const result = await connectionPromise;
    botInstance = result.bot;
    return result;
  } catch (error) {
    console.error('Bot connection error:', error);
    connectionPromise = null;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function setupBotEvents(bot: any, saveCreds: () => Promise<void>, phoneNumber: string) {
  // Connection update handler
  bot.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      console.log('Connection closed:', lastDisconnect?.error);
      const { statusCode, error } = lastDisconnect?.error?.output?.payload || {};
      
      if (statusCode === 401 && error === 'Unauthorized') {
        try {
          const sessionDir = path.join(process.cwd(), 'sessions', currentSession?.sessionId || '');
          await fs.rm(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.log('Failed to remove session directory:', error);
        }
      }
      
      // Update session status
      await BotUtils.updateSession(phoneNumber, {
        isConnected: false,
        lastActivity: new Date()
      });
      
      // Reset connection promise
      connectionPromise = null;
    }
    
    if (connection === 'open') {
      console.log('Bot connected successfully!');
      console.log('Connected with:', bot.user.id.split(':')[0]);
      
      // Update session status
      await BotUtils.updateSession(phoneNumber, {
        isConnected: true,
        pairingCode: null,
        lastActivity: new Date()
      });
      
      // Validate phone number if configured
      if (globalConfig.bot.number && globalConfig.bot.number !== bot.user.id.split(':')[0]) {
        console.log('Unauthorized number detected');
        await bot.logout();
        return;
      }
    }
  });

  // Credentials update handler
  bot.ev.on('creds.update', saveCreds);

  // Messages upsert handler
  bot.ev.on('messages.upsert', async ({ messages }: any) => {
    if (messages.length > 0) {
      await handleMessagesUpsert(bot, messages[0]);
    }
  });
}

async function handleMessagesUpsert(bot: any, m: any) {
  try {
    if (!m.message) return;

    // Process message
    const processedMessage = processMessage(m, bot);
    
    // Save message to database
    await BotUtils.saveMessage({
      messageId: processedMessage.id,
      chatId: processedMessage.chatId,
      senderId: processedMessage.senderId,
      content: processedMessage.text,
      command: processedMessage.isCommand ? processedMessage.cmd : null
    });
    
    if (!processedMessage.isCommand) return;

    console.log(`Command received: ${processedMessage.cmd} from ${processedMessage.senderId}`);

    // Handle commands
    const response = await handleCommand(bot, processedMessage);
    
    // Update message with response
    if (response) {
      await BotUtils.saveMessage({
        messageId: `${processedMessage.id}_response`,
        chatId: processedMessage.chatId,
        senderId: 'bot',
        content: response,
        command: processedMessage.cmd,
        response: processedMessage.cmd
      });
    }
    
  } catch (error) {
    console.error('Message handling error:', error);
  }
}

function processMessage(m: any, bot: any) {
  const id = m.key.id;
  const chatId = m.key.remoteJid;
  const isGroup = chatId.endsWith('@g.us');
  const isPrivate = chatId.endsWith('@s.whatsapp.net');
  const isStory = chatId === 'status@broadcast';
  const isNewsletter = chatId.endsWith('@newsletter');
  
  const senderId = isNewsletter
    ? ''
    : isGroup || isStory
    ? m.key.participant || chatId
    : chatId;
  
  const fromMe = m.key.fromMe;
  const isOwner = senderId.split('@')[0] === globalConfig.owner.number;
  
  const messageType = Object.keys(m.message)[0];
  const messageContent = m.message[messageType];
  
  let body = '';
  let text = '';
  
  if (messageType === 'conversation') {
    body = messageContent;
    text = messageContent;
  } else if (messageContent) {
    body = messageContent.caption || 
           messageContent.text || 
           messageContent.singleSelectReply?.selectedRowId || 
           messageContent.selectedButtonId || 
           (messageContent.nativeFlowResponseMessage?.paramsJson 
             ? JSON.parse(messageContent.nativeFlowResponseMessage.paramsJson).id 
             : '') ||
           '';
    
    text = messageContent.caption || 
           messageContent.text || 
           messageContent.description || 
           messageContent.title || 
           messageContent.contentText || 
           messageContent.selectedDisplayText || 
           '';
  }

  // Sanitize input
  body = BotUtils.sanitizeInput(body);
  text = BotUtils.sanitizeInput(text);

  const isCommand = body.trim().startsWith(globalConfig.bot.prefix);
  const cmd = isCommand 
    ? body.trim().normalize('NFKC').replace(globalConfig.bot.prefix, '').split(' ')[0].toLowerCase()
    : '';
  
  const args = body.trim()
    .replace(/^\S*\b/g, '')
    .split(' ')
    .map(arg => arg.trim().normalize('NFKC'))
    .filter(arg => arg);

  const replyFunction = async (text: string) => {
    try {
      return await bot.sendMessage(chatId, {
        text
      }, {
        quoted: {
          key: {
            id,
            fromMe: false,
            remoteJid: 'status@broadcast',
            participant: '0@s.whatsapp.net'
          },
          message: {
            conversation: `💬 ${text}`
          }
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    id,
    chatId,
    isGroup,
    isPrivate,
    isStory,
    isNewsletter,
    senderId,
    fromMe,
    isOwner,
    isPremium: false, // Add premium logic if needed
    type: messageType,
    body,
    text,
    isCommand,
    cmd,
    args,
    reply: replyFunction,
    pushName: m.pushName
  };
}

async function handleCommand(bot: any, m: any): Promise<string | null> {
  try {
    let response: string | null = null;

    switch (m.cmd) {
      case 'menu':
        response = await handleMenuCommand(bot, m);
        break;
      case 'ping':
        response = await handlePingCommand(bot, m);
        break;
      case 'info':
        response = await handleInfoCommand(bot, m);
        break;
      case 'help':
        response = await handleHelpCommand(bot, m);
        break;
      case 'stats':
        response = await handleStatsCommand(bot, m);
        break;
      default:
        // Handle custom commands from global config
        const customCommand = globalConfig.bot.commands.find((cmd: any) => cmd.command === m.cmd);
        if (customCommand) {
          response = await customCommand.handler(bot, m);
        } else {
          response = `Command "${m.cmd}" not found. Type ${globalConfig.bot.prefix}help for available commands.`;
        }
    }

    if (response) {
      await m.reply(response);
    }

    return response;
  } catch (error) {
    console.error('Command handling error:', error);
    const errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    await m.reply(errorMessage);
    return errorMessage;
  }
}

async function handleMenuCommand(bot: any, m: any): Promise<string> {
  const stats = await BotUtils.getMessageStats();
  const menuText = `
*WhatsApp Bot Menu*

Available Commands:
${globalConfig.bot.prefix}menu - Show this menu
${globalConfig.bot.prefix}ping - Check bot status
${globalConfig.bot.prefix}info - Get bot information
${globalConfig.bot.prefix}help - Show help information
${globalConfig.bot.prefix}stats - Show bot statistics

*Bot Status:* Online
*Owner:* ${globalConfig.owner.name}
*Prefix:* ${globalConfig.bot.prefix}
*Total Messages:* ${stats.totalMessages}
*Today's Messages:* ${stats.todayMessages}
  `;
  return menuText;
}

async function handlePingCommand(bot: any, m: any): Promise<string> {
  const pingTime = Date.now();
  await m.reply('Pinging...');
  const pongTime = Date.now();
  return `Pong! Response time: ${pongTime - pingTime}ms`;
}

async function handleInfoCommand(bot: any, m: any): Promise<string> {
  const stats = await BotUtils.getMessageStats();
  const infoText = `
*Bot Information*

*Name:* WhatsApp Bot
*Version:* 1.0.0
*Platform:* Node.js
*Library:* Baileys
*Owner:* ${globalConfig.owner.name}
*Prefix:* ${globalConfig.bot.prefix}
*Commands:* ${globalConfig.bot.commands.length + 5}

*Status:* Connected
*User ID:* ${bot.user?.id || 'Unknown'}
*Phone:* ${bot.user?.id?.split(':')[0] || 'Unknown'}
*Total Messages:* ${stats.totalMessages}
*Total Commands:* ${stats.totalCommands}
  `;
  return infoText;
}

async function handleHelpCommand(bot: any, m: any): Promise<string> {
  const helpText = `
*WhatsApp Bot Help*

*Getting Started:*
1. Use ${globalConfig.bot.prefix}menu to see available commands
2. Use ${globalConfig.bot.prefix}ping to check if bot is online
3. Use ${globalConfig.bot.prefix}info to get bot information
4. Use ${globalConfig.bot.prefix}stats to see bot statistics

*Available Commands:*
• ${globalConfig.bot.prefix}menu - Show command menu
• ${globalConfig.bot.prefix}ping - Check bot response time
• ${globalConfig.bot.prefix}info - Get bot information
• ${globalConfig.bot.prefix}help - Show this help message
• ${globalConfig.bot.prefix}stats - Show bot statistics

*Tips:*
• All commands start with ${globalConfig.bot.prefix}
• The bot works in both private and group chats
• Some commands may require owner privileges
• Response time may vary based on server load

*Need more help?* Contact the bot owner: ${globalConfig.owner.name}
  `;
  return helpText;
}

async function handleStatsCommand(bot: any, m: any): Promise<string> {
  const stats = await BotUtils.getMessageStats();
  const sessions = await BotUtils.getAllSessions();
  const activeSessions = sessions.filter(s => s.isConnected);
  
  const statsText = `
*Bot Statistics*

*Message Statistics:*
• Total Messages: ${stats.totalMessages}
• Total Commands: ${stats.totalCommands}
• Today's Messages: ${stats.todayMessages}
• Today's Commands: ${stats.todayCommands}

*Session Statistics:*
• Total Sessions: ${sessions.length}
• Active Sessions: ${activeSessions.length}
• Inactive Sessions: ${sessions.length - activeSessions.length}

*System Information:*
• Bot Status: Online
• Uptime: ${process.uptime().toFixed(2)} seconds
• Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Node.js Version: ${process.version}

*Last Updated:* ${BotUtils.formatTimestamp(new Date())}
  `;
  return statsText;
}

export async function disconnectBot(bot: any): Promise<void> {
  try {
    if (bot) {
      await bot.logout();
      bot = null;
      connectionPromise = null;
      
      // Update session status
      if (currentSession) {
        await BotUtils.updateSession(currentSession.phoneNumber, {
          isConnected: false,
          lastActivity: new Date()
        });
      }
      
      console.log('Bot disconnected successfully');
    }
  } catch (error) {
    console.error('Error disconnecting bot:', error);
    throw error;
  }
}

// Configuration functions
export function setBotConfig(config: any) {
  Object.assign(globalConfig, config);
}

export function addCommand(command: string, handler: (bot: any, m: any) => Promise<string>, options: any = {}) {
  globalConfig.bot.commands.push({
    command,
    handler,
    ...options
  });
}

// Utility functions
export function getBotInstance() {
  return botInstance;
}

export function isBotConnected() {
  return botInstance !== null && connectionPromise !== null;
}

export function getCurrentSession() {
  return currentSession;
}