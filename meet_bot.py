from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import sys
import io
import subprocess
import asyncio
import websockets
import json
from dotenv import load_dotenv
import os

# ✅ Load environment variables from .env
load_dotenv()

# ✅ WebSocket Server URL (for sending transcriptions)
WS_SERVER_URL = "ws://localhost:5000"

# ✅ Deepgram API Key (Loaded from .env)
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

if not DEEPGRAM_API_KEY:
    print("❌ ERROR: Deepgram API Key is missing. Please check your .env file.")
    sys.exit(1)

def join_meeting(meeting_link):
    """Joins the Google Meet meeting automatically."""
    options = Options()
    options.add_argument("--use-fake-ui-for-media-stream")  # Prevents permission pop-ups
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-features=AudioServiceOutOfProcess")  # Mutes all audio
    options.add_argument("--mute-audio")

    # ✅ Use your Chrome profile (Adjust Profile Path if needed)
    options.add_argument(r'--user-data-dir=C:\\Users\\DELL\\AppData\\Local\\Google\\Chrome\\User Data')  
    options.add_argument('--profile-directory=Profile 11')  

    # ✅ Set correct ChromeDriver path
    service = Service("C:\\Program Files\\chromedriver-win64\\chromedriver.exe")
    driver = webdriver.Chrome(service=service, options=options)

    print("🚀 Opening Google Meet...")
    driver.get(meeting_link)
    time.sleep(5)  # Wait for page to load

    try:
        # ✅ Disable microphone
        mic_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//div[@aria-label='Turn off microphone']"))
        )
        mic_button.click()
        print("✅ Microphone turned off.")
    except:
        print("⚠️ Microphone button not found or already off.")

    try:
        # ✅ Disable camera
        cam_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//div[@aria-label='Turn off camera']"))
        )
        cam_button.click()
        print("✅ Camera turned off.")
    except:
        print("⚠️ Camera button not found or already off.")

    try:
        # ✅ Click "Dismiss" button if Meet asks for mic/cam permissions
        dismiss_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//span[contains(text(),'Dismiss')]"))
        )
        dismiss_button.click()
        time.sleep(2)
        print("✅ Dismissed permissions request.")
    except:
        print("⚠️ No 'Dismiss' button found. Continuing...")

    # ✅ Automatically click "Join now" or "Ask to join"
    try:
        join_now_button = WebDriverWait(driver, 8).until(
            EC.element_to_be_clickable((By.XPATH, "//span[contains(text(),'Join now')]"))
        )
        join_now_button.click()
        print("✅ Successfully joined the meeting!")
    except:
        print("⚠️ 'Join now' button not found. Trying 'Ask to join'...")

        try:
            ask_to_join_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//span[contains(text(),'Ask to join')]"))
            )
            ask_to_join_button.click()
            print("✅ Clicked 'Ask to join'. Waiting for approval...")
        except Exception as e:
            print("❌ Failed to join meeting:", e)

    return driver

def start_audio_capture():
    """Captures meeting audio using FFmpeg."""
    print("🎤 Starting audio capture...")
    
    # ✅ FFmpeg command to capture system audio
    ffmpeg_cmd = [
        "ffmpeg",
        "-f", "dshow",  # DirectShow for Windows
        "-i", "audio=Stereo Mix",  # Capture system audio (Modify if needed)
        "-ac", "1",  # Convert to mono
        "-ar", "16000",  # Sample rate for Deepgram
        "-acodec", "pcm_s16le",  # 16-bit PCM format
        "-f", "wav",  # Output format
        "pipe:1"  # Pipe output to stdout
    ]

    process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    return process

async def transcribe_audio(process):
    """Streams captured audio to Deepgram for transcription."""
    print("📝 Connecting to Deepgram for real-time transcription...")

    uri = f"wss://api.deepgram.com/v1/listen?access_token={DEEPGRAM_API_KEY}"
    
    async with websockets.connect(uri) as ws:
        # ✅ Send Deepgram configuration
        await ws.send(json.dumps({"type": "config", "model": "whisper"}))

        while True:
            audio_chunk = process.stdout.read(4096)  # Read audio in small chunks
            if not audio_chunk:
                break
            await ws.send(audio_chunk)  # Send audio to Deepgram

            # ✅ Receive transcription
            response = await ws.recv()
            data = json.loads(response)

            if "channel" in data and "alternatives" in data["channel"]:
                transcription = data["channel"]["alternatives"][0]["transcript"]
                if transcription:
                    print(f"📝 Transcription: {transcription}")
                    await send_to_websocket(transcription)

async def send_to_websocket(transcription):
    """Sends transcriptions to the WebSocket server."""
    async with websockets.connect(WS_SERVER_URL) as ws:
        await ws.send(json.dumps({"transcription": transcription}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: Please provide a Google Meet link.")
        sys.exit(1)

    driver = join_meeting(sys.argv[1])

    # ✅ Start capturing audio
    audio_process = start_audio_capture()

    # ✅ Start real-time transcription
    loop = asyncio.get_event_loop()
    loop.run_until_complete(transcribe_audio(audio_process))

    # ✅ Keep bot in meeting until manually stopped
    print("🤖 Bot is now in the meeting. Press CTRL+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🚪 Exiting Google Meet...")
        driver.quit()
        audio_process.terminate()
        print("✅ Bot has left the meeting.")
