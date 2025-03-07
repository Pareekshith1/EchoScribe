# EchoScribe - Real-time AI Summarizer with Speech-to-Text Transcription

EchoScribe is a powerful real-time speech-to-text transcription application that leverages **Deepgram's WebSocket API** for highly accurate and efficient voice recognition.

## 🚀 Features
- **Real-time Speech-to-Text Conversion** 📢➡️📝
- **AI-powered Speech Recognition** by Deepgram 🤖
- **Low-latency Streaming** via WebSocket 🚀
- **Supports Multiple Languages & Models** 🌍

## 📥 Installation

### Prerequisites
Ensure you have the following installed before proceeding:
- **Node.js** (Recommended: `v18.x.x` or `v20.x.x`)
- **Deepgram API Key** 🔑
- **Stable Internet Connection** 🌐

### Setup
Clone the repository and navigate into the project folder:
```sh
git clone https://github.com/yourusername/EchoScribe.git
cd EchoScribe
```

Install dependencies:
```sh
npm install
```

Set up your Deepgram API key:
```sh
# Mac/Linux
export DEEPGRAM_API_KEY="your_actual_api_key"

# Windows (CMD)
set DEEPGRAM_API_KEY=your_actual_api_key
```

Start the server:
```sh
node server.js
```

## 🎤 Usage
Simply speak into your microphone and see real-time transcriptions displayed in your terminal or web interface.

Modify WebSocket URL parameters to adjust **language/model settings** as per your requirements.

## 🛠 Troubleshooting
### WebSocket Connection Issues
If you face WebSocket failures, try these steps:
- ✅ **Check API Key:** Ensure `DEEPGRAM_API_KEY` is correctly set.
- 🔗 **Verify WebSocket URL:** Use `wss://api.deepgram.com/v1/listen`.
- 🌐 **Check Internet Connection:** Run `ping api.deepgram.com`.
- 🔄 **Downgrade Node.js if needed:** Use an **LTS version** (`v20.x.x` or `v18.x.x`).

### Debugging Tips
Add logging in `server.js` for better issue tracking:
```js
console.log("Connecting to Deepgram...");
ws.on("open", () => console.log("✅ WebSocket connected"));
ws.on("close", () => console.log("❌ WebSocket disconnected"));
ws.on("error", (err) => console.error("WebSocket Error:", err));
```

## 📜 License
This project is licensed under the **MIT License**.

## 👨‍💻 Author(s)
- **Pareekshith P**
- **Arun Kumar K**
- **Mohammed Naseem**
- **Pozhilan A**

---


