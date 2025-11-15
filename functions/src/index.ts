/**
 * Main entry point for the Discord Bot Cloud Function
 * This file sets up the Express server with middleware and routes
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express, {Request, Response} from "express";
import cors from "cors";
import {verifyKeyMiddleware} from "discord-interactions";
import {handleCommand} from "./commands";

// Initialize Express app
const app = express();

// Apply CORS middleware to allow frontend Activity to make requests
app.use(cors({origin: true}));

// Apply JSON body parser
app.use(express.json());

// Discord bot interactions route - secured with Discord's public key
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY || ""),
  async (req: Request, res: Response) => {
    try {
      logger.info("Received interaction", {structuredData: true});
      const response = await handleCommand(req.body);
      res.json(response);
    } catch (error) {
      logger.error("Error handling interaction:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({status: "ok", timestamp: new Date().toISOString()});
});

// Export the Express app as a Cloud Function
export const api = onRequest(app);
