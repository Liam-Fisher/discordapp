/**
 * Bot command handlers
 * Processes Discord slash commands and returns appropriate responses
 */

import {InteractionType, InteractionResponseType} from "discord-interactions";
import * as logger from "firebase-functions/logger";
import {bucket} from "./firebase";
import {formatSampleEmbed, formatErrorResponse} from "./discord";
import {samples, COMMAND_NAMES} from "./constants";

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
      case COMMAND_NAMES.SAMPLE:
        return handleSampleCommand(interaction);
      default:
        return formatErrorResponse(`Unknown command: ${commandName}`);
    }
  }

  return formatErrorResponse("Unsupported interaction type");
}

/**
 * Handles the /sample command
 * @param {any} interaction - The Discord interaction object
 * @return {Promise<object>} Discord interaction response
 */
async function handleSampleCommand(interaction: any): Promise<object> {
  try {
    // Get the sample name from command options
    const options = interaction.data.options || [];
    const nameOption = options.find((opt: any) => opt.name === "name");

    if (!nameOption || !nameOption.value) {
      return formatErrorResponse("Please provide a sample name");
    }

    const sampleName = nameOption.value;

    // Check if sample exists in our constants array
    if (!samples.includes(sampleName)) {
      return formatErrorResponse(
        `Sample "${sampleName}" not found. Available samples: ${samples.join(", ")}`
      );
    }

    // Get file URLs from Firebase Storage
    const audioUrl = await getFileUrl(`samples/${sampleName}.mp3`);
    const imageUrl = await getFileUrl(`samples/${sampleName}.png`);

    // Return formatted embed response
    return formatSampleEmbed(sampleName, audioUrl, imageUrl);
  } catch (error) {
    logger.error("Error in handleSampleCommand:", error);
    return formatErrorResponse("Failed to fetch sample files");
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
