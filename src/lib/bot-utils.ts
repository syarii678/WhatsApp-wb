import { db } from '@/lib/db';

export interface BotSession {
  id: string;
  phoneNumber: string;
  sessionId: string;
  isConnected: boolean;
  pairingCode?: string;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotMessage {
  id: string;
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  command?: string;
  response?: string;
  timestamp: Date;
}

export interface BotCommand {
  id: string;
  command: string;
  description: string;
  handler: string;
  isOwnerOnly: boolean;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BotUtils {
  // Session management
  static async createSession(phoneNumber: string, sessionId: string): Promise<BotSession> {
    return await db.botSession.create({
      data: {
        phoneNumber,
        sessionId,
        isConnected: false
      }
    });
  }

  static async updateSession(phoneNumber: string, updates: Partial<BotSession>): Promise<BotSession | null> {
    return await db.botSession.update({
      where: { phoneNumber },
      data: updates
    });
  }

  static async getSession(phoneNumber: string): Promise<BotSession | null> {
    return await db.botSession.findUnique({
      where: { phoneNumber }
    });
  }

  static async deleteSession(phoneNumber: string): Promise<boolean> {
    try {
      await db.botSession.delete({
        where: { phoneNumber }
      });
      return true;
    } catch {
      return false;
    }
  }

  static async getAllSessions(): Promise<BotSession[]> {
    return await db.botSession.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Message management
  static async saveMessage(messageData: Omit<BotMessage, 'id' | 'timestamp'>): Promise<BotMessage> {
    return await db.botMessage.create({
      data: {
        ...messageData,
        timestamp: new Date()
      }
    });
  }

  static async getMessages(chatId?: string, limit: number = 50): Promise<BotMessage[]> {
    if (chatId) {
      return await db.botMessage.findMany({
        where: { chatId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    }
    return await db.botMessage.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  static async getMessageStats(): Promise<{
    totalMessages: number;
    totalCommands: number;
    todayMessages: number;
    todayCommands: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [totalMessages, totalCommands, todayMessages, todayCommands] = await Promise.all([
      db.botMessage.count(),
      db.botMessage.count({ where: { command: { not: null } } }),
      db.botMessage.count({ where: { timestamp: { gte: startOfDay } } }),
      db.botMessage.count({ 
        where: { 
          command: { not: null },
          timestamp: { gte: startOfDay }
        } 
      })
    ]);

    return {
      totalMessages,
      totalCommands,
      todayMessages,
      todayCommands
    };
  }

  // Command management
  static async addCommand(commandData: Omit<BotCommand, 'id' | 'createdAt' | 'updatedAt'>): Promise<BotCommand> {
    return await db.botCommand.create({
      data: commandData
    });
  }

  static async getCommands(activeOnly: boolean = true): Promise<BotCommand[]> {
    if (activeOnly) {
      return await db.botCommand.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      });
    }
    return await db.botCommand.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  static async updateCommand(commandId: string, updates: Partial<BotCommand>): Promise<BotCommand | null> {
    return await db.botCommand.update({
      where: { id: commandId },
      data: updates
    });
  }

  static async deleteCommand(commandId: string): Promise<boolean> {
    try {
      await db.botCommand.delete({
        where: { id: commandId }
      });
      return true;
    } catch {
      return false;
    }
  }

  // Configuration management
  static async setConfig(key: string, value: string): Promise<void> {
    await db.botConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  static async getConfig(key: string, defaultValue?: string): Promise<string | null> {
    const config = await db.botConfig.findUnique({
      where: { key }
    });
    return config?.value || defaultValue || null;
  }

  static async getAllConfigs(): Promise<Record<string, string>> {
    const configs = await db.botConfig.findMany();
    return configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);
  }

  // Utility functions
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generatePairingCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^[1-9]\d{6,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  static sanitizeInput(input: string): string {
    // Remove potentially harmful characters
    return input.replace(/[<>]/g, '');
  }

  static formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  static async cleanupOldSessions(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db.botSession.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate },
        isConnected: false
      }
    });
    
    return result.count;
  }

  static async cleanupOldMessages(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db.botMessage.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });
    
    return result.count;
  }
}