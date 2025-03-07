from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import sys
import io

# ✅ Fix UnicodeEncodeError in Windows Terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def join_meeting(meeting_link):
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

    # ✅ Keep the bot in the meeting indefinitely
    print("🤖 Bot is now in the meeting. Press CTRL+C to stop.")
    try:
        while True:
            time.sleep(1)  # Keeps the script running
    except KeyboardInterrupt:
        print("🚪 Exiting Google Meet...")
        driver.quit()
        print("✅ Bot has left the meeting.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: Please provide a Google Meet link.")
        sys.exit(1)
    join_meeting(sys.argv[1])
