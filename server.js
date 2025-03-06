require("dotenv").config();
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const axios = require("axios"); // Use axios to call Ollama

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

let fullTranscript = [];

// WebSocket server for real-time transcription
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
                fullTranscript.push(transcriptData.transcript); // Store full transcript
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

// 🔹 Generate Summary & Key Points using Ollama
app.post("/generate-summary", async (req, res) => {
    try {
        const transcriptText = fullTranscript.join(" ");
        console.log("📄 Full Transcript Received:", transcriptText);

        // 🔹 Call Ollama API for summary
        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "mistral",
            prompt: `Summarize this transcript and extract key points:\n\n"${transcriptText}"`,
            stream: false,
        });

        // Extract summary text from Ollama's response
        const summary = response.data.response;

        res.json({ summary });

    } catch (error) {
        console.error("❌ Ollama API Error:", error);
        res.status(500).json({ error: "Failed to generate summary" });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
