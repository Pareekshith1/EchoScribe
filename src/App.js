import React, { useState, useEffect } from "react";

const App = () => {
    const [transcript, setTranscript] = useState([]);
    const [socket, setSocket] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [summary, setSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket("ws://localhost:5001");

            ws.onopen = () => console.log("✅ WebSocket connected");
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setTranscript((prev) => [...prev, ...data.words]);
            };

            ws.onerror = (error) => console.error("WebSocket error:", error);

            ws.onclose = () => {
                console.warn("❌ WebSocket closed. Reconnecting in 3 seconds...");
                setTimeout(connectWebSocket, 3000);
            };

            setSocket(ws);
        };

        connectWebSocket();
    }, []);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

        recorder.ondataavailable = (event) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(event.data);
            }
        };

        recorder.start(500);
        setMediaRecorder(recorder);
    };

    const stopRecording = async () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }

        setLoadingSummary(true);
        try {
            const response = await fetch("http://localhost:5000/generate-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            setSummary(data.summary);
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
        setLoadingSummary(false);
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>Real-Time Speech-to-Text with Summary & Key Points</h1>
            <button onClick={startRecording}>Start Recording</button>
            <button onClick={stopRecording} style={{ marginLeft: "10px" }}>
                Stop Recording
            </button>

            <h3>Live Transcript:</h3>
            <div style={{ textAlign: "left", padding: "20px", border: "1px solid black" }}>
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

            <h3>Overview:</h3>
            {loadingSummary ? <p>Generating summary...</p> : <p>{summary}</p>}
        </div>
    );
};

export default App;
