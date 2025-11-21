# Discord Pokemon Bot 🎮

A serverless Discord bot built on Firebase Cloud Functions that lets users request Pokemon sprites and cries directly in Discord channels.

## Features

- 🎯 **Slash Commands**: Use `/pkmn <pokemon-name>` to get Pokemon data
- 🖼️ **Visual Embeds**: High-quality Pokemon sprites displayed in rich embeds
- 🔊 **Audio Support**: Clickable links to Pokemon cries (audio files)
- ☁️ **Serverless**: Built on Firebase Cloud Functions (Node.js 18)
- 🚀 **CI/CD**: Automated deployment via GitHub Actions
- 📦 **1,119 Pokemon**: Complete collection including variants and mega evolutions

## Quick Start

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Discord Application with bot enabled
- Firebase project on **Blaze (Pay as you go) plan**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd discordapp

# Install dependencies
cd functions
npm install
```

### Configuration

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Fill in your Discord credentials (get from [Discord Developer Portal](https://discord.com/developers/applications)):
```bash
DISCORD_APP_ID=your_app_id
DISCORD_TOKEN=your_bot_token
DISCORD_PUBLIC_KEY=your_public_key
```

### Local Development

```bash
# Build and watch for changes
npm run build:watch

# Or start Firebase emulators
firebase emulators:start
```

### Deployment

#### Manual Deployment
```bash
cd functions
npm run build
firebase deploy --only functions
```

#### Automatic Deployment (Recommended)
Push to the `main` branch and GitHub Actions will automatically deploy:
```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

### Register Commands

After deployment, register slash commands with Discord:
```bash
cd functions
npm run register-commands
```

### Configure Discord

1. Get your Cloud Function URL from Firebase Console
2. Go to [Discord Developer Portal](https://discord.com/developers/applications)
3. Navigate to your app > General Information
4. Set **Interactions Endpoint URL** to:
   ```
   https://us-central1-singular-array-387200.cloudfunctions.net/api/interactions
   ```
5. Click "Save Changes" (Discord will verify the endpoint)

## Usage

Invite the bot to your Discord server and use:

```
/pkmn pikachu
/pkmn charizard
/pkmn mewtwo-mega
```

The bot will respond with an embed containing the Pokemon's sprite and a clickable audio link.

## Architecture

```
Discord Bot
    ↓
Firebase Cloud Functions (Node.js 18)
    ↓
Firebase Storage (Sprites & Audio)
    ↓
Discord Client (Renders embeds)
```

### Tech Stack

- **Backend**: Firebase Cloud Functions v2 (Node.js 18)
- **Storage**: Firebase Storage (sprites + audio files)
- **Database**: Firebase Firestore (optional metadata)
- **Framework**: Express.js
- **Language**: TypeScript
- **CI/CD**: GitHub Actions

## Project Structure

```
discordapp/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD workflow
├── functions/
│   ├── src/
│   │   ├── index.ts            # Main Cloud Function entry point
│   │   ├── commands.ts         # Bot command handlers & schemas
│   │   ├── firebase.ts         # Firebase Admin SDK singleton
│   │   ├── discord.ts          # Discord API formatting helpers
│   │   └── constants.ts        # Pokemon names array (1,119 entries)
│   ├── scripts/
│   │   └── register-commands.ts # Discord command registration script
│   ├── package.json
│   └── tsconfig.json
├── .env.example                # Environment variables template
├── CLAUDE.MD                   # Detailed technical documentation
└── README.md                   # This file
```

## Environment Variables

### Local Development (.env)
- `DISCORD_APP_ID` - Discord Application ID
- `DISCORD_TOKEN` - Discord Bot Token
- `DISCORD_PUBLIC_KEY` - Discord Public Key

### GitHub Secrets (CI/CD)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase service account JSON
- `DISCORD_PUBLIC_KEY` - Discord Public Key
- `DISCORD_APP_ID` - Discord Application ID
- `DISCORD_TOKEN` - Discord Bot Token

See [CLAUDE.MD](./CLAUDE.MD) for detailed setup instructions.

## GitHub Actions Workflow

The `.github/workflows/deploy.yml` automatically:

1. ✅ Checks out code on push to `main`
2. ✅ Sets up Node.js 18 environment
3. ✅ Installs dependencies
4. ✅ Runs linter
5. ✅ Builds TypeScript
6. ✅ Deploys to Firebase
7. ✅ Sets environment variables

## Commands

```bash
# Development
npm run build          # Compile TypeScript
npm run build:watch    # Watch mode
npm run lint           # Run ESLint
npm run serve          # Start local emulators

# Deployment
npm run deploy         # Deploy to Firebase
npm run register-commands  # Register Discord commands

# Utility
npm run logs           # View Firebase logs
```

## Troubleshooting

### Bot commands don't appear
- Ensure you ran `npm run register-commands`
- Wait a few minutes for Discord to propagate changes
- Reinvite the bot with proper scopes

### "Invalid signature" error
- Verify `DISCORD_PUBLIC_KEY` is correct in Firebase config
- Check for extra whitespace in the key
- Redeploy: `firebase deploy --only functions`

### Deployment fails
- Ensure Firebase project is on **Blaze plan**
- Verify service account has required roles (see CLAUDE.MD)
- Check GitHub Secrets are set correctly

For detailed troubleshooting, see [CLAUDE.MD](./CLAUDE.MD#-troubleshooting).

## Documentation

- **[CLAUDE.MD](./CLAUDE.MD)** - Comprehensive technical documentation, architecture details, and migration notes
- **[Firebase Console](https://console.firebase.google.com/)** - Monitor functions, view logs, manage storage
- **[Discord Developer Portal](https://discord.com/developers/applications)** - Manage bot application and credentials

## Contributing

This project uses:
- **TypeScript** for type safety
- **ESLint** for code quality (Google style guide)
- **Firebase Admin SDK** for backend operations
- **discord-interactions** for signature verification

Key principles:
- Simplicity over abstraction
- Type safety throughout
- Separation of concerns (Discord, Firebase, commands)

## License

[Your license here]

## Support

For detailed documentation, architecture explanations, and setup guides, see [CLAUDE.MD](./CLAUDE.MD).

---

**Made with ❤️ for Pokemon fans and Discord communities**
