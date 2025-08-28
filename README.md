# WhatsApp Bot Web

A comprehensive WhatsApp bot web application built with Next.js, featuring pairing code authentication, real-time monitoring, and a modern web interface.

## Features

- **Pairing Code Authentication**: Connect your WhatsApp bot using pairing code instead of QR codes
- **Real-time Monitoring**: Live bot status, message logs, and activity tracking
- **Modern Web Interface**: Clean, responsive UI built with Next.js and Tailwind CSS
- **Database Integration**: SQLite database with Prisma ORM for session and message management
- **Command System**: Extensible command system with built-in commands
- **Session Management**: Secure session handling with automatic cleanup
- **Message Logging**: Complete message history with search and filtering capabilities
- **Statistics Dashboard**: Real-time bot statistics and performance metrics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with Prisma ORM
- **WhatsApp Library**: @whiskeysockets/baileys
- **Authentication**: Pairing code based authentication
- **UI Components**: shadcn/ui with Lucide icons

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WhatsApp account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-bot-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Connecting the Bot

1. **Enter Phone Number**: In the web interface, go to the "Connect" tab and enter your WhatsApp phone number (with country code, without the "+" sign).

2. **Generate Pairing Code**: Click "Connect with Pairing Code" to generate a pairing code.

3. **Link Device**: 
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices > Link a Device
   - Enter the pairing code shown in the web interface

4. **Connection Complete**: Your bot will be connected and ready to use!

### Available Commands

- `!menu` - Show available commands
- `!ping` - Check bot response time
- `!info` - Get bot information
- `!help` - Show help information
- `!stats` - Show bot statistics

### Web Interface Features

- **Dashboard**: Real-time bot status, connection info, and activity metrics
- **Connect**: Bot connection management with pairing code
- **Commands**: View available bot commands
- **Logs**: Real-time bot activity logs

## Project Structure

```
whatsapp-bot-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── bot/
│   │   │       ├── connect/
│   │   │       │   └── route.ts
│   │   │       ├── status/
│   │   │       │   └── route.ts
│   │   │       └── disconnect/
│   │   │           └── route.ts
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   │   ├── bot-connector.ts
│   │   ├── bot-utils.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   └── hooks/
├── prisma/
│   └── schema.prisma
├── sessions/
├── public/
├── package.json
└── README.md
```

## API Endpoints

### Bot Connection
- `POST /api/bot/connect` - Connect bot with phone number
- `GET /api/bot/status` - Get bot connection status
- `POST /api/bot/disconnect` - Disconnect bot

### Database Models

- **BotSession**: Stores bot session information
- **BotMessage**: Logs all messages and commands
- **BotCommand**: Manages custom commands
- **BotConfig**: Stores configuration settings

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
```

### Custom Commands

You can add custom commands by modifying the `bot-connector.ts` file:

```typescript
import { addCommand } from '@/lib/bot-connector';

// Add a custom command
addCommand('hello', async (bot, m) => {
  return 'Hello! How can I help you today?';
}, {
  description: 'Say hello',
  isOwnerOnly: false,
  isPremium: false
});
```

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set environment variables
   - Deploy automatically

### Termux Deployment

1. **Install Termux** from F-Droid

2. **Update packages**
   ```bash
   pkg update && pkg upgrade
   ```

3. **Install Node.js**
   ```bash
   pkg install nodejs
   ```

4. **Install Git**
   ```bash
   pkg install git
   ```

5. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd whatsapp-bot-web
   npm install
   npm run db:push
   npm run build
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Connection Failed**: 
   - Ensure phone number is correct (with country code, no "+")
   - Check internet connection
   - Verify WhatsApp is up-to-date

2. **Pairing Code Expired**:
   - Generate a new pairing code
   - Complete the pairing process within 60 seconds

3. **Session Issues**:
   - Delete the `sessions` directory
   - Restart the application
   - Reconnect with a new pairing code

4. **Database Errors**:
   - Run `npm run db:push` to update schema
   - Check database file permissions
   - Verify DATABASE_URL environment variable

### Logs

Check the following logs for debugging:
- Application logs: `console.log` output
- Development logs: `dev.log`
- Server logs: `server.log`

## Security Considerations

- **Session Security**: Sessions are stored locally and encrypted
- **Input Validation**: All user inputs are sanitized
- **Rate Limiting**: Implement rate limiting for production use
- **Environment Variables**: Sensitive data stored in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error messages

## Acknowledgments

- **@whiskeysockets/baileys** - WhatsApp Web API library
- **Next.js** - React framework
- **Prisma** - Database ORM
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library