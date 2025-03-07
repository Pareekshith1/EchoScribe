import React, { useState, useEffect } from "react";

const App = () => {
    const [meetURL, setMeetURL] = useState("");
    const [transcript, setTranscript] = useState([]);
    const [socket, setSocket] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [summary, setSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);

    // 🔗 Connect WebSocket for live transcription
    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket("ws://localhost:5001");

            ws.onopen = () => console.log("✅ WebSocket connected");
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setTranscript((prev) => [...prev, ...data.words]);
            };

            ws.onerror = (error) => console.error("❌ WebSocket error:", error);

            ws.onclose = () => {
                console.warn("⚠️ WebSocket closed. Reconnecting in 3 seconds...");
                setTimeout(connectWebSocket, 3000);
            };

            setSocket(ws);
        };

        connectWebSocket();
    }, []);

    // 🎤 Start Bot & Join Google Meet
    const startBot = async () => {
        if (!meetURL.trim() || !meetURL.startsWith("https://meet.google.com/")) {
            alert("❌ Please enter a valid Google Meet URL");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/start-bot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: meetURL }),
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                alert(`❌ Error: ${data.error || "Failed to start bot"}`);
                return;
            }

            console.log("🚀 Bot started successfully and joined the meeting.");
        } catch (error) {
            console.error("❌ Error starting bot:", error);
            alert("❌ Failed to start bot. Please check the server.");
        }
    };

    // 🚫 Stop Bot & Leave Google Meet
    const stopBot = async () => {
        try {
            const response = await fetch("http://localhost:5000/stop-bot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                alert(`❌ Error: ${data.error || "Failed to stop bot"}`);
                return;
            }

            console.log("🛑 Bot has left the meeting successfully.");
            alert("✅ Bot has left the meeting.");
        } catch (error) {
            console.error("❌ Error stopping bot:", error);
            alert("❌ Failed to stop bot. Please check the server.");
        }
    };

    // 🎤 Start Recording & Send Audio to WebSocket
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

            recorder.ondataavailable = (event) => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };

            recorder.start(500);
            setMediaRecorder(recorder);
            console.log("🎙 Recording started...");
        } catch (error) {
            console.error("❌ Error starting recording:", error);
        }
    };

    // 🛑 Stop Recording & Generate Summary
    const stopRecording = async () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            console.log("🎙 Recording stopped.");
        }

        setLoadingSummary(true);
        try {
            const response = await fetch("http://localhost:5000/generate-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            setSummary(data.summary);
            console.log("📄 Summary generated successfully.");
        } catch (error) {
            console.error("❌ Error fetching summary:", error);
        }
        setLoadingSummary(false);
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>MeetScribe - AI Meeting Transcriber</h1>

            {/* Google Meet URL Input */}
            <input
                type="text"
                value={meetURL}
                onChange={(e) => setMeetURL(e.target.value)}
                placeholder="Enter Google Meet URL"
                style={{ padding: "10px", width: "60%", marginBottom: "10px" }}
            />
            <br />

            {/* Bot Controls */}
            <button onClick={startBot}>Start Bot</button>
            <button onClick={stopBot} style={{ marginLeft: "10px" }}>Stop Bot</button>

            <h3>Live Transcript:</h3>

            {/* Live Transcription Output */}
            <div style={{ textAlign: "left", padding: "20px", border: "1px solid black", height: "200px", overflowY: "auto" }}>
                {transcript.length > 0 ? (
                    transcript.map((word, index) => (
                        <p key={index}>
                            <strong>[{word.speaker || "Unknown"}]</strong> {word.punctuated_word}
                        </p>
                    ))
                ) : (
                    <p>No transcript available</p>
                )}
            </div>

            {/* Recording Controls */}
            <button onClick={startRecording} style={{ marginTop: "20px" }}>Start Recording</button>
            <button onClick={stopRecording} style={{ marginLeft: "10px" }}>Stop Recording</button>

            <h3>Overview:</h3>
            {loadingSummary ? <p>Generating summary...</p> : <p>{summary}</p>}
        </div>
    );
};

export default App;
