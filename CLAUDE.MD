# Discord Pokemon Bot - Project Overview

## 📋 Project Description

This is a Discord bot built on Firebase Cloud Functions that allows users to request Pokemon sprites and cries (audio) directly in Discord. Users can type `/pkmn <pokemon-name>` and receive an embed with the Pokemon's image and a clickable audio link.

## 🏗️ Architecture

This project uses a **serverless backend** architecture:

- **Discord Bot** → Sends slash commands
- **Firebase Cloud Functions** → Handles Discord interactions
- **Firebase Storage** → Stores Pokemon sprites (.png) and cries (.mp3)
- **Firebase Firestore** → (Optional) Stores Pokemon metadata
- **Discord Client** → Auto-unfurls audio/image links into embeds

### Key Architectural Decision: Audio Embedding

**Important:** Discord does NOT support embedded audio players like `<audio>` tags. Instead, you provide a **direct link** to an audio file, and Discord's client automatically "unfurls" it into an inline player.

This is handled in `discord.ts:30-32`:
```typescript
if (audioUrl) {
  embed.description = `[🔊 Listen to ${name}](${audioUrl})`;
}
```

When Discord sees a direct link to `.mp3`, `.wav`, or `.ogg`, it renders an audio player automatically—just like with GIFs and images.

---

## 🔄 Migration: Angular Frontend → Firebase Backend

This project was migrated from an **Angular frontend** using `@angular/fire` to a **Firebase Cloud Functions backend** using `firebase-admin`.

### Before (Angular Service)
```typescript
// Used getDownloadURL from @angular/fire/storage
async addPokemonMedia(index: number, name: string) {
  const sprite = await getDownloadURL(this.getRef(`sprites/${index}.png`));
  const cry = await getDownloadURL(this.getRef(`cries/${name}.mp3`));
  return {index, name, sprite, cry};
}
```

### After (Firebase Admin Backend)
```typescript
// Now uses firebase-admin
async function getPokemonMedia(name: string) {
  const spriteFile = bucket.file(`sprites/${name}.png`);
  const cryFile = bucket.file(`cries/${name}.mp3`);

  const sprite = await getFileUrl(`sprites/${name}.png`);
  const cry = await getFileUrl(`cries/${name}.mp3`);

  return {sprite, cry};
}
```

**Key Changes:**
- **`getDownloadURL`** → **`bucket.file().getSignedUrl()`** (or `.publicUrl()` for public files)
- **Client-side service** → **Server-side Firebase Admin singleton**
- **Angular dependency injection** → **Direct module imports**

---

## 📁 Project Structure

```
discordapp/
├── functions/
│   ├── src/
│   │   ├── index.ts          # Main Cloud Function entry point
│   │   ├── commands.ts        # Bot command handlers (routes /pkmn command)
│   │   ├── firebase.ts        # Firebase Admin SDK singleton (db, bucket, storage)
│   │   ├── discord.ts         # Discord formatting helpers (embeds, responses)
│   │   └── constants.ts       # Pokemon names array (pkmn[])
│   ├── package.json
│   └── tsconfig.json
├── CLAUDE.MD                  # This file
├── scan_pokemon_cries.js      # Script to scan local Pokemon cry files
└── pokemon_cries_list.txt     # List of scanned .mp3 files
```

---

## 🔑 Key Files

### 1. **`functions/src/index.ts`**
- Entry point for Firebase Cloud Functions
- Exports the main HTTP function that Discord calls
- Verifies Discord signatures and routes requests to `commands.ts`

### 2. **`functions/src/firebase.ts`**
- **Firebase Admin singleton**
- Initializes Firebase Admin SDK once
- Exports: `db` (Firestore), `storage`, `bucket`, and `admin`

**Why a singleton?** Firebase Admin should only be initialized once per Cloud Function instance to avoid memory leaks and performance issues.

### 3. **`functions/src/discord.ts`**
- Contains Discord formatting utilities
- **`formatSampleEmbed(name, audioUrl, imageUrl)`** - Creates rich embeds with Pokemon data
- **`formatTextResponse(message, ephemeral)`** - Simple text responses
- **`formatErrorResponse(error)`** - Error messages (ephemeral by default)

**Critical Function:** `formatSampleEmbed` correctly embeds audio by creating a **hyperlink** in the description field. Discord's client then auto-renders this as an audio player.

### 4. **`functions/src/commands.ts`**
- **Main bot logic**
- Routes Discord commands (currently supports `/pkmn`)
- **`handlePkmnCommand(interaction)`** - Processes `/pkmn` commands
- **`getPokemonMedia(name)`** - Fetches sprite and cry URLs from Firebase Storage
- **`getPokemonData()`** - (Optional) Fetches Pokemon metadata from Firestore
- **`getFileUrl(filePath)`** - Generates signed URLs for Firebase Storage files

**Translation Layer:** This file contains the functions that replaced the old Angular `FirebaseLoaderService`.

### 5. **`functions/src/constants.ts`**
- Contains the `pkmn` array with 1,119 Pokemon names (lowercase, hyphenated)
- Contains `COMMAND_NAMES` object for command routing
- Generated from `pokemon_cries_list.txt` using `scan_pokemon_cries.js`

---

## 🚀 How It Works

### 1. User Types Command
```
/pkmn pikachu
```

### 2. Discord Sends Interaction
Discord sends an HTTP POST to your Firebase Cloud Function with the interaction data.

### 3. Cloud Function Processes Request
```typescript
// index.ts verifies signature → commands.ts routes to handler
handlePkmnCommand(interaction)
  → Validates "pikachu" exists in pkmn[] array
  → Calls getPokemonMedia("pikachu")
    → Gets signed URL for sprites/pikachu.png
    → Gets signed URL for cries/pikachu.mp3
  → Calls formatSampleEmbed("pikachu", cryUrl, spriteUrl)
  → Returns Discord embed object
```

### 4. Discord Renders Embed
Discord receives the response and renders:
- **Embed title:** "Sample: pikachu"
- **Embed image:** The sprite (auto-rendered from URL)
- **Embed description:** `[🔊 Listen to pikachu](https://...)` (auto-rendered as audio player)

---

## 🛠️ Setup & Deployment

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)
- Discord Bot Application with slash commands enabled
- Firebase project on **Blaze (Pay as you go) plan** (required for Node.js 18+ functions)

### Installation
```bash
cd functions
npm install
```

### Development
```bash
# Start Firebase emulators locally
firebase emulators:start

# Or build and watch for changes
npm run build:watch
```

---

## 🚀 Deployment & Setup Guide

### Step 1: Configure Environment Variables

#### Local Development (.env file)
Create a `.env` file in the project root (use `.env.example` as template):

```bash
DISCORD_APP_ID=your_app_id_here
DISCORD_TOKEN=your_bot_token_here
DISCORD_PUBLIC_KEY=your_public_key_here
```

**Where to find these values:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. **Application ID**: Copy from "General Information" page
4. **Public Key**: Copy from "General Information" page
5. **Bot Token**: Go to "Bot" tab and copy the token

#### GitHub Secrets (for CI/CD)
Add the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON key | Firebase Console > Project Settings > Service Accounts > Generate New Private Key |
| `DISCORD_PUBLIC_KEY` | Discord bot public key | Discord Developer Portal > General Information |
| `DISCORD_APP_ID` | Discord application ID | Discord Developer Portal > General Information |
| `DISCORD_TOKEN` | Discord bot token | Discord Developer Portal > Bot |

**Important:** The `FIREBASE_SERVICE_ACCOUNT_KEY` should be the entire JSON key file contents (it's already JSON, don't encode it).

---

### Step 2: Firebase Setup

#### Ensure Blaze Plan
Cloud Functions with Node.js 18+ require the **Blaze (Pay as you go)** plan:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`singular-array-387200`)
3. Navigate to "Upgrade" or check current plan in Project Settings
4. Upgrade to Blaze plan if needed

#### Configure Firebase Service Account Roles
The service account used for deployment needs these roles:
- **Cloud Functions Developer** (deploy functions)
- **Service Account User** (required for App Engine default service account)
- **Cloud Scheduler Admin** (if using scheduled functions)
- **Secret Manager Viewer** (if using secrets)
- **Firebase Admin SDK Administrator Service Agent**

To configure:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" > "IAM"
3. Find your service account
4. Click "Edit" and add the required roles

---

### Step 3: Deploy to Firebase

#### Option A: Manual Deployment (Local)
```bash
# Build the functions
cd functions
npm run build

# Deploy to Firebase
npm run deploy

# Or deploy only functions
firebase deploy --only functions
```

#### Option B: Automatic Deployment (GitHub Actions)
The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to Firebase when you push to the `main` branch.

**What the workflow does:**
1. ✅ Checks out code
2. ✅ Sets up Node.js 18
3. ✅ Installs dependencies with `npm ci`
4. ✅ Lints code with `npm run lint`
5. ✅ Builds functions with `npm run build`
6. ✅ Deploys to Firebase Cloud Functions
7. ✅ Sets environment variables in Firebase

**To trigger deployment:**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

---

### Step 4: Register Discord Slash Commands

After deploying, you need to register the bot commands with Discord:

```bash
cd functions
npm run register-commands
```

This will:
- Read commands from `functions/src/commands.ts`
- Register them with Discord's API using your credentials from `.env`
- Display confirmation for each registered command

**Expected output:**
```
🚀 Registering Discord Slash Commands...
   Application ID: 123456789
   Commands to register: 1

   1. /pkmn - Get a Pokemon's sprite and cry

📡 Sending request to Discord API...

✅ Successfully registered commands!
   Registered 1 command(s)

   ✓ /pkmn (ID: 987654321)

🎉 All commands registered successfully!
```

---

### Step 5: Configure Discord Developer Portal

This is the **critical final step** for the bot to work:

1. **Get your Cloud Function URL**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Navigate to "Functions" dashboard
   - Find your `api` function
   - Copy the URL (format: `https://us-central1-singular-array-387200.cloudfunctions.net/api`)

2. **Set Interactions Endpoint URL in Discord**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - Go to "General Information"
   - Scroll to "Interactions Endpoint URL"
   - Paste: `https://us-central1-singular-array-387200.cloudfunctions.net/api/interactions`
     - **Note:** Add `/interactions` to the end of the function URL
   - Click "Save Changes"

3. **Verify the endpoint**
   - Discord will send a verification request immediately
   - If it fails, check:
     - ✅ The URL is correct (includes `/interactions`)
     - ✅ The function is deployed and running
     - ✅ Environment variables are set correctly in Firebase
     - ✅ `DISCORD_PUBLIC_KEY` matches exactly (no extra spaces)

**Common verification errors:**
- ❌ "The URL did not respond" → Function not deployed or URL incorrect
- ❌ "Invalid signature" → `DISCORD_PUBLIC_KEY` environment variable incorrect
- ❌ "Timed out" → Function is cold starting (try again)

---

### Step 6: Test Your Bot

1. Invite your bot to a Discord server
2. Type `/pkmn pikachu` in any channel
3. The bot should respond with:
   - An embed with Pikachu's sprite image
   - A clickable link to Pikachu's cry (audio)

---

## 🔧 Troubleshooting

### Bot commands not appearing in Discord
- Run `npm run register-commands` again
- Wait a few minutes for Discord to propagate changes
- Try in a different server or channel

### "Invalid signature" error
- Verify `DISCORD_PUBLIC_KEY` is set correctly in Firebase Functions config
- Check for extra whitespace or line breaks in the key
- Redeploy after fixing: `firebase deploy --only functions`

### Function deployment fails
- Ensure Firebase project is on Blaze plan
- Check service account has correct permissions
- Verify `firebase.json` is configured correctly

### Environment variables not working
In Firebase Functions, environment variables are set using:
```bash
firebase functions:config:set discord.public_key="your_key"
```

Access them in code with:
```typescript
process.env.DISCORD_PUBLIC_KEY
```

Or retrieve current config:
```bash
firebase functions:config:get
```

---

## 📋 Environment Variables Reference

### Required for Local Development
- `DISCORD_APP_ID` - Discord Application ID
- `DISCORD_TOKEN` - Discord Bot Token
- `DISCORD_PUBLIC_KEY` - Discord Public Key

### Required for GitHub Actions
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase service account JSON
- `DISCORD_PUBLIC_KEY` - Discord Public Key
- `DISCORD_APP_ID` - Discord Application ID
- `DISCORD_TOKEN` - Discord Bot Token

### Set in Firebase Functions (via GitHub Actions or CLI)
- `discord.public_key` - Discord Public Key
- `discord.app_id` - Discord Application ID
- `discord.token` - Discord Bot Token

**Note:** The GitHub Actions workflow automatically sets these in Firebase after deployment.

---

## 📦 Firebase Storage Structure

```
gs://your-bucket/
├── sprites/
│   ├── pikachu.png
│   ├── charizard.png
│   └── ... (1,119 total)
└── cries/
    ├── pikachu.mp3
    ├── charizard.mp3
    └── ... (1,119 total)
```

**File naming convention:** Lowercase, hyphenated (e.g., `mega-charizard-x.mp3`)

---

## 🔐 Security Notes

- Discord interactions are verified using **Ed25519 signature verification** (handled in `index.ts`)
- Firebase Storage files use **signed URLs** with 1-hour expiration
- Firestore and Storage security rules should be configured appropriately

---

## 🎯 Future Enhancements

- [ ] Add autocomplete for Pokemon names
- [ ] Support for alternate forms (Alolan, Galarian, etc.)
- [ ] Caching layer to reduce Firebase Storage reads
- [ ] Additional commands (`/pokedex`, `/shiny`, etc.)
- [ ] Move from signed URLs to public URLs (if files are meant to be public)

---

## 📝 Development Notes

### Why Signed URLs?
`getSignedUrl()` generates temporary, authenticated URLs that expire after 1 hour. This is useful if your Firebase Storage bucket is **not public**.

If your files **are public**, you can use:
```typescript
const url = bucket.file(filePath).publicUrl();
```
This is faster (no async call) but only works if Storage rules allow public reads.

### Pokemon Index vs Name
The original Angular service used **index** for sprites and **name** for cries:
```typescript
sprites/${index}.png  // e.g., sprites/25.png
cries/${name}.mp3     // e.g., cries/pikachu.mp3
```

The current implementation uses **name for both**. If you have sprites organized by index (Pokedex number), you'll need to add an index lookup mapping.

---

## 🤝 Contributing

This project was migrated from an Angular frontend to a Firebase backend. The migration preserved the core functionality while adapting to serverless architecture.

Key principles:
- **Simplicity:** Use Firebase Admin SDK directly (no ORM or heavy abstractions)
- **Type Safety:** TypeScript throughout
- **Separation of Concerns:** Discord formatting, Firebase access, and command logic are separate modules

---

## 📄 License

[Your license here]

---

## 🙋 Questions?

If you're migrating from Angular or another frontend framework to Firebase Cloud Functions, remember:
1. Replace client-side Firebase SDKs with `firebase-admin`
2. Services become simple exported functions
3. Authentication context shifts from user auth to service account auth
4. Use singletons for Firebase Admin initialization

Happy coding! 🎮
