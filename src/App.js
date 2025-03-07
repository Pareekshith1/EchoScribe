import React, { useState, useEffect } from "react";

const App = () => {
    const [meetURL, setMeetURL] = useState("");
    const [transcript, setTranscript] = useState([]);
    const [socket, setSocket] = useState(null);
    const [summary, setSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [botActive, setBotActive] = useState(false);

    // 🔗 Connect WebSocket for live transcription
    useEffect(() => {
        let ws = new WebSocket("ws://localhost:5001");

        ws.onopen = () => console.log("✅ WebSocket connected");
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data.words)) {
                    setTranscript((prev) => [...prev, ...data.words]);
                }
            } catch (error) {
                console.error("❌ Error parsing WebSocket message:", error);
            }
        };

        ws.onerror = (error) => console.error("❌ WebSocket error:", error);

        ws.onclose = () => {
            console.warn("⚠ WebSocket closed. Reconnecting in 3 seconds...");
            setTimeout(() => {
                ws = new WebSocket("ws://localhost:5001");
                setSocket(ws);
            }, 3000);
        };

        setSocket(ws);

        return () => {
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;
            ws.close();
        };
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
            setBotActive(true);
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
            setBotActive(false);

            // Fetch summary after stopping bot
            setLoadingSummary(true);
            const summaryResponse = await fetch("http://localhost:5000/generate-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const summaryData = await summaryResponse.json();
            setSummary(summaryData.summary || "No summary available.");
            setLoadingSummary(false);
            console.log("📄 Summary generated successfully.");
        } catch (error) {
            console.error("❌ Error stopping bot:", error);
            alert("❌ Failed to stop bot. Please check the server.");
            setLoadingSummary(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
            <div className="max-w-3xl w-full bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-3xl font-bold text-center text-blue-600">MeetScribe - AI Meeting Transcriber</h1>
                <p className="text-center text-gray-600 mt-2">Real-time transcription and AI-powered summaries</p>

                {/* Google Meet URL Input */}
                <div className="mt-6">
                    <input
                        type="text"
                        value={meetURL}
                        onChange={(e) => setMeetURL(e.target.value)}
                        placeholder="Enter Google Meet URL"
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Bot Controls */}
                <div className="mt-6 flex justify-center space-x-4">
                    <button
                        onClick={startBot}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
                            botActive ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        disabled={botActive}
                    >
                        {botActive ? "Bot Running..." : "Start Bot"}
                    </button>
                    <button
                        onClick={stopBot}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
                            botActive ? "bg-red-600 hover:bg-red-700" : "bg-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!botActive}
                    >
                        Stop Bot & Generate Summary
                    </button>
                </div>

                {/* Live Transcription Section */}
                <h3 className="mt-8 text-xl font-semibold text-blue-600">Live Transcript:</h3>
                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg h-48 overflow-y-auto shadow-sm">
                    {transcript.length > 0 ? (
                        transcript.map((word, index) => (
                            <p key={index} className="text-gray-800">
                                <strong>[{word.speaker || "Unknown"}]</strong> {word.punctuated_word}
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-500">No transcript available</p>
                    )}
                </div>

                {/* Summary Section */}
                <h3 className="mt-8 text-xl font-semibold text-blue-600">Overview:</h3>
                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    {loadingSummary ? <p className="text-gray-500">Generating summary...</p> : <p>{summary}</p>}
                </div>
            </div>
        </div>
    );
};

export default App;