EchoScribe - Real-time Ai Summarizer with Speech-to-Text Transcription

EchoScribe is a real-time speech-to-text transcription application that utilizes Deepgram's WebSocket API for accurate and efficient voice recognition.

Features

Real-time speech-to-text conversion

Powered by Deepgram's AI-based speech recognition

WebSocket-based streaming for low-latency transcription

Supports multiple languages and models

Installation

Prerequisites

Node.js (Recommended: v18.x.x or v20.x.x)

Deepgram API Key

A stable internet connection

Setup

Clone the repository:

git clone https://github.com/yourusername/EchoScribe.git
cd EchoScribe

Install dependencies:

npm install

Set up your Deepgram API key:

export DEEPGRAM_API_KEY="your_actual_api_key" # Mac/Linux
set DEEPGRAM_API_KEY=your_actual_api_key # Windows (CMD)

Run the server:

node server.js

Usage

Speak into your microphone and see real-time transcriptions on your terminal or web interface.

Modify WebSocket URL parameters to adjust language/model settings.

Troubleshooting

WebSocket Connection Issues

If you encounter a WebSocket failure, try the following:

Check API Key: Ensure DEEPGRAM_API_KEY is set correctly.

Verify WebSocket URL: Use wss://api.deepgram.com/v1/listen.

Check Internet Connection: Run ping api.deepgram.com.

Downgrade Node.js if needed: Use a stable LTS version (v20.x.x or v18.x.x).

Debugging

Add logging in server.js:

console.log("Connecting to Deepgram...");
ws.on("open", () => console.log("✅ WebSocket connected"));
ws.on("close", () => console.log("❌ WebSocket disconnected"));
ws.on("error", (err) => console.error("WebSocket Error:", err));

License

This project is licensed under the MIT License.

Author

**Pareekshith P**

**Arun Kumar K **

**Mohammed Naseem **

**Pozhilan A**
