import dotenv from "dotenv";
import readline from "readline";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function initializeChat() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const expertise = await loadExpertise();
    const expertiseChatArray = expertise.map(e => ({
        role: "user",
        parts: [{ text: e }]
    }));

    return model.startChat({
        expertise: expertiseChatArray,
        generationConfig: { maxOutputTokens: 250 },
    });
}

async function loadExpertise() {
    const [rule, basic] = await Promise.all([
        fs.readFile('dataset/rules.txt', 'utf8'),
        fs.readFile('dataset/hiking-tips-espertise.txt', 'utf8'),
    ]);
    return [rule, basic];
}

async function startChat(chat) {
    const chatbot = async () => {
        rl.question("You: ", async (msg) => {
            if (msg.toLowerCase() === "exit") {
                rl.close();
                return;
            }

            try {
                const { response } = await chat.sendMessage(msg);
                console.log("AI:\n", response.text());
                console.log("------------------------------------------");
            } catch (error) {
                console.error("Error:", error.message);
            }

            chatbot();
        });
    };

    chatbot();
}

(async function run() {
    try {
        const chat = await initializeChat();
        await startChat(chat);
    } catch (error) {
        console.error("Initialization error:", error.message);
        rl.close();
    }
})();
