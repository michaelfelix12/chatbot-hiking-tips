import { Client } from 'whatsapp-web.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import qrcode from 'qrcode-terminal';
import dotenv from "dotenv";
import { initializeChat } from "./expertise.js";

// Load environment variables
dotenv.config();

if (!process.env.API_KEY) {
    console.error("Error: API_KEY is not set in the environment variables.");
    process.exit(1);
}

// Initialize WhatsApp client and Google Generative AI client
const client = new Client();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
let chat;

async function main() {
    try {
        // Initialize the chat with expertise
        chat = await initializeChat();

        // Setup WhatsApp client event listeners
        setupEventListeners();

        // Start the WhatsApp client
        client.initialize();
    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
}

// Setup event listeners for the WhatsApp client
function setupEventListeners() {
    client.on('qr', handleQR);
    client.on('ready', handleReady);
    client.on('message', handleMessage);
}

// Generate QR code for WhatsApp login
function handleQR(qr) {
    console.log("Generate QR code for WhatsApp login:");
    qrcode.generate(qr, { small: true });
    console.log("QR code generation complete.");
}

// Log when the client is ready
function handleReady() {
    console.log("WhatsApp client is ready!");
}

// Process incoming WhatsApp messages
async function handleMessage(msg) {
    try {
        if (msg.body === '!mediainfo' && msg.hasMedia) {
            return handleMediaInfo(msg);
        }

        await respondWithGenerativeAI(msg);
    } catch (error) {
        console.error("Error processing message:", error);
        msg.reply("Apologies, an error occurred while handling your request.");
    }
}

// Respond with Google Generative AI
async function respondWithGenerativeAI(msg) {
    const { response } = await chat.sendMessage([{ text: msg.body }]);
    msg.reply(response.text());
}

// Provide media info if requested
async function handleMediaInfo(msg) {
    try {
        msg.reply("I am sorry. I am just answering text-based chats.");
        const attachmentData = await msg.downloadMedia();
        const mediaInfo = `
            Media info:
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename || "N/A"}
            Data (length): ${attachmentData.data.length}
        `;
        msg.reply(mediaInfo);
    } catch (error) {
        console.error("Error handling media info:", error);
        msg.reply("An error occurred while processing the media.");
    }
}

main();
