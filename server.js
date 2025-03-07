require("dotenv").config();
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
let fullTranscript = [];
let botProcess = null;

// WebSocket Server for Real-Time Transcription
const wss = new WebSocket.Server({ port: 5001 });

wss.on("connection", async (ws) => {
    console.log("🔗 Client connected for real-time transcription");

    try {
        const live = await deepgram.listen.live({
            model: "nova-3",
            punctuate: true,
            diarize: true,
            interim_results: true,
        });

        live.on(LiveTranscriptionEvents.Open, () => console.log("🎤 Deepgram WebSocket connected!"));

        live.on(LiveTranscriptionEvents.Transcript, (data) => {
            if (data.channel && data.channel.alternatives[0]) {
                const transcriptData = data.channel.alternatives[0];
                fullTranscript.push(transcriptData.transcript);
                ws.send(JSON.stringify(transcriptData));
            }
        });

        ws.on("message", (audioChunk) => {
            live.send(audioChunk);
        });

        ws.on("close", () => {
            console.log("❌ Client disconnected");
            live.requestClose();
        });

    } catch (error) {
        console.error("🔥 Deepgram Initialization Failed:", error.message);
        ws.close();
    }
});

// Start Google Meet Bot
app.post("/start-bot", async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "Meet URL is required!" });
    }

    console.log(`🚀 Starting Google Meet bot for: ${url}`);

    if (botProcess) {
        botProcess.kill();
        botProcess = null;
    }

    botProcess = exec(
        `PYTHONIOENCODING=utf-8 python meet_bot.py "${url}"`,
        (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error starting bot:", error);
                return res.status(500).json({ error: "Failed to start bot" });
            }
            console.log("✅ Bot started successfully:", stdout);
        }
    );

    res.json({ message: "Bot started successfully!" });
});

// Stop Google Meet Bot
app.post("/stop-bot", async (req, res) => {
    console.log("🛑 Stopping Google Meet bot...");

    if (botProcess) {
        botProcess.kill();
        botProcess = null;
        fullTranscript = []; // Reset transcript after stopping the bot
        console.log("✅ Bot stopped successfully.");
        return res.json({ message: "Bot stopped successfully!" });
    }

    res.status(400).json({ error: "No bot is currently running." });
});

// Generate Summary & Key Points using Ollama
app.post("/generate-summary", async (req, res) => {
    try {
        if (fullTranscript.length === 0) {
            return res.status(400).json({ error: "No transcript available for summarization." });
        }

        const transcriptText = fullTranscript.join(" ");
        console.log("📄 Full Transcript Received:", transcriptText);

        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "mistral",
            prompt: `Summarize this transcript and extract key points:\n\n"${transcriptText}"`,
            stream: false,
        });

        const summary = response.data.response;
        res.json({ summary });

    } catch (error) {
        console.error("❌ Ollama API Error:", error);
        res.status(500).json({ error: "Failed to generate summary" });
    }
});

// Start Express Server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
