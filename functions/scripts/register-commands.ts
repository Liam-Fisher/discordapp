/**
 * Discord Slash Command Registration Script
 *
 * This script registers slash commands with Discord's API.
 * It should be run after deploying functions or when commands change.
 *
 * Usage:
 *   npm run register-commands
 *
 * Environment Variables Required:
 *   - DISCORD_APP_ID: Your Discord Application ID
 *   - DISCORD_TOKEN: Your Discord Bot Token
 */

import * as dotenv from "dotenv";
import * as path from "path";
import {COMMANDS} from "../src/commands";

// Load environment variables from .env file
dotenv.config({path: path.resolve(__dirname, "../../.env")});

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_APP_ID || !DISCORD_TOKEN) {
  console.error("❌ Error: Missing required environment variables");
  console.error("   DISCORD_APP_ID:", DISCORD_APP_ID ? "✓" : "✗");
  console.error("   DISCORD_TOKEN:", DISCORD_TOKEN ? "✓" : "✗");
  console.error("\nPlease create a .env file in the project root with:");
  console.error("   DISCORD_APP_ID=your_app_id");
  console.error("   DISCORD_TOKEN=your_bot_token");
  process.exit(1);
}

/**
 * Registers slash commands with Discord's API
 */
async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`;

  console.log("🚀 Registering Discord Slash Commands...");
  console.log(`   Application ID: ${DISCORD_APP_ID}`);
  console.log(`   Commands to register: ${COMMANDS.length}`);
  console.log("");

  // Display commands being registered
  COMMANDS.forEach((cmd, index) => {
    console.log(`   ${index + 1}. /${cmd.name} - ${cmd.description}`);
  });

  console.log("\n📡 Sending request to Discord API...");

  try {
    // Use dynamic import for node-fetch (ESM module)
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(COMMANDS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to register commands: ${response.status}`);
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log("\n✅ Successfully registered commands!");
    console.log(`   Registered ${Array.isArray(data) ? data.length : 0} command(s)`);
    console.log("");

    if (Array.isArray(data)) {
      data.forEach((cmd: any) => {
        console.log(`   ✓ /${cmd.name} (ID: ${cmd.id})`);
      });
    }

    console.log("\n🎉 All commands registered successfully!");
    console.log("   You can now use these commands in Discord");
  } catch (error) {
    console.error("❌ Error registering commands:", error);
    process.exit(1);
  }
}

// Run the registration
registerCommands();
