/**
 * Discord helper functions
 * Contains utilities for formatting Discord API responses
 */

import {InteractionResponseType} from "discord-interactions";

/**
 * Formats a rich embed message for a sample
 * @param {string} name - The name of the sample
 * @param {string} audioUrl - URL to the audio file
 * @param {string} imageUrl - URL to the image file
 * @return {object} Discord interaction response object
 */
export function formatSampleEmbed(
  name: string,
  audioUrl?: string,
  imageUrl?: string
) {
  const embed: any = {
    title: `Sample: ${name}`,
    color: 0x5865f2, // Discord blurple color
    timestamp: new Date().toISOString(),
  };

  if (imageUrl) {
    embed.image = {url: imageUrl};
  }

  if (audioUrl) {
    embed.description = `[🔊 Listen to ${name}](${audioUrl})`;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  };
}

/**
 * Formats a simple text response
 * @param {string} message - The message to send
 * @param {boolean} ephemeral - Whether message is ephemeral
 * @return {object} Discord interaction response object
 */
export function formatTextResponse(message: string, ephemeral = false) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: message,
      flags: ephemeral ? 64 : 0, // 64 = EPHEMERAL flag
    },
  };
}

/**
 * Formats an error response
 * @param {string} error - The error message
 * @return {object} Discord interaction response object
 */
export function formatErrorResponse(error: string) {
  return formatTextResponse(`❌ Error: ${error}`, true);
}
