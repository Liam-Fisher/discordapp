/**
 * Bot command handlers
 * Processes Discord slash commands and returns appropriate responses
 */

import {InteractionType, InteractionResponseType} from "discord-interactions";
import * as logger from "firebase-functions/logger";
import {bucket, db} from "./firebase";
import {formatSampleEmbed, formatErrorResponse} from "./discord";
import {pkmn, COMMAND_NAMES} from "./constants";

/**
 * Main command handler - routes interactions to appropriate handlers
 * @param {any} interaction - The Discord interaction object
 * @return {Promise<object>} Discord interaction response
 */
export async function handleCommand(interaction: any): Promise<object> {
  // Handle PING interactions (Discord verification)
  if (interaction.type === InteractionType.PING) {
    return {
      type: InteractionResponseType.PONG,
    };
  }

  // Handle APPLICATION_COMMAND interactions
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interaction.data.name;

    logger.info(`Handling command: ${commandName}`, {structuredData: true});

    // Route to appropriate command handler
    switch (commandName) {
      case COMMAND_NAMES.PKMN:
        return handlePkmnCommand(interaction);
      default:
        return formatErrorResponse(`Unknown command: ${commandName}`);
    }
  }

  return formatErrorResponse("Unsupported interaction type");
}

/**
 * Handles the /pkmn command
 * Fetches Pokemon sprite and cry from Firebase Storage
 * @param {any} interaction - The Discord interaction object
 * @return {Promise<object>} Discord interaction response
 */
async function handlePkmnCommand(interaction: any): Promise<object> {
  try {
    // Get the Pokemon name from command options
    const options = interaction.data.options || [];
    const nameOption = options.find((opt: any) => opt.name === "name");

    if (!nameOption || !nameOption.value) {
      return formatErrorResponse("Please provide a Pokemon name");
    }

    const pokemonName = nameOption.value.toLowerCase();

    // Check if Pokemon exists in our constants array
    if (!pkmn.includes(pokemonName)) {
      return formatErrorResponse(
        `Pokemon "${pokemonName}" not found. Try checking the spelling!`
      );
    }

    // Get Pokemon media URLs from Firebase Storage
    const {sprite, cry} = await getPokemonMedia(pokemonName);

    // Return formatted embed response
    return formatSampleEmbed(pokemonName, cry, sprite);
  } catch (error) {
    logger.error("Error in handlePkmnCommand:", error);
    return formatErrorResponse("Failed to fetch Pokemon media");
  }
}

/**
 * Gets Pokemon sprite and cry URLs from Firebase Storage
 * Translation of the old Angular FirebaseLoaderService.addPokemonMedia()
 * Now uses firebase-admin instead of @angular/fire
 * @param {string} name - Pokemon name (lowercase, hyphenated)
 * @return {Promise<{sprite: string, cry: string}>} URLs for sprite and cry
 */
async function getPokemonMedia(name: string): Promise<{sprite?: string, cry?: string}> {
  try {
    // Get references to the files
    // Note: Pokemon names use index for sprites, but name for cries
    // For now, using name for both - adjust if you have index mapping
    const spriteFile = bucket.file(`sprites/${name}.png`);
    const cryFile = bucket.file(`cries/${name}.mp3`);

    // Get URLs for the files
    const sprite = await getFileUrl(`sprites/${name}.png`);
    const cry = await getFileUrl(`cries/${name}.mp3`);

    return {sprite, cry};
  } catch (error) {
    logger.error(`Error getting Pokemon media for ${name}:`, error);
    return {};
  }
}

/**
 * Gets Pokemon data from Firestore
 * Translation of the old Angular FirebaseLoaderService Firestore methods
 * @return {Promise<any>} Pokemon data from Firestore
 */
async function getPokemonData(): Promise<any> {
  try {
    const doc = await db.doc("lists/media").get();
    const docData = doc.data() ?? {};
    return docData;
  } catch (error) {
    logger.error("Error getting Pokemon data from Firestore:", error);
    return {};
  }
}

/**
 * Gets a signed URL for a file in Firebase Storage
 * @param {string} filePath - Path to the file in storage
 * @return {Promise<string | undefined>} Signed URL or undefined if file doesn't exist
 */
async function getFileUrl(filePath: string): Promise<string | undefined> {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      logger.warn(`File not found: ${filePath}`);
      return undefined;
    }

    // Generate a signed URL valid for 1 hour
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return url;
  } catch (error) {
    logger.error(`Error getting file URL for ${filePath}:`, error);
    return undefined;
  }
}
