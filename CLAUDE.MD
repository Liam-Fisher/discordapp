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
- Firebase project with Cloud Functions and Storage enabled

### Installation
```bash
cd functions
npm install
```

### Development
```bash
firebase emulators:start
```

### Deployment
```bash
firebase deploy --only functions
```

### Registering Discord Commands
You'll need to register the `/pkmn` slash command with Discord using their API:
```json
{
  "name": "pkmn",
  "description": "Get a Pokemon's sprite and cry",
  "options": [
    {
      "name": "name",
      "description": "Pokemon name (e.g., pikachu, charizard)",
      "type": 3,
      "required": true
    }
  ]
}
```

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
