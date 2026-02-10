import os
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\bin"
import subprocess
import whisper
import sounddevice as sd
import numpy as np
import soundfile as sf
import google.generativeai as genai

# =========================
# PATH CONFIG
# =========================

PIPER_EXE = r"C:\piper\piper.exe"
VOICE_MODEL = r"C:\piper\voices\hi.onnx"
OUTPUT_WAV = r"C:\piper\out.wav"
INPUT_WAV = "input.wav"

# =========================
# GEMINI API KEY
# =========================

genai.configure(api_key="AIzaSyDIXFi83mOj5FRSLkYo731VRQdvmieCQNQ")
llm = genai.GenerativeModel("gemini-2.5-flash")

# =========================
# LOAD MODELS
# =========================

print("Loading Whisper...")
stt_model = whisper.load_model("base")
print("Whisper loaded")

# =========================
# AUDIO SETTINGS
# =========================

SAMPLE_RATE = 16000
CHANNELS = 1

# =========================
# RECORD VOICE
# =========================

def record_audio(seconds=5):
    print("🎙 Speak now...")
    audio = sd.rec(
        int(seconds * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype=np.float32
    )
    sd.wait()
    sf.write(INPUT_WAV, audio, SAMPLE_RATE)
    print("Recording finished.")

# =========================
# PIPER TTS
# =========================

def speak(text):
    print("🗣 AI:", text)

    cmd = [
        PIPER_EXE,
        "-m", VOICE_MODEL,
        "-f", OUTPUT_WAV
    ]

    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    process.stdin.write(text.encode("utf-8"))
    process.stdin.close()
    process.wait()

    if os.path.exists(OUTPUT_WAV):
        os.startfile(OUTPUT_WAV)
    else:
        print("❌ Piper failed to generate audio")

# =========================
# MAIN LOOP
# =========================

print("\nVoice Agent Ready")
print("Say 'exit' to stop\n")

while True:

    record_audio()

    result = stt_model.transcribe(INPUT_WAV)
    user_text = result["text"].strip()

    print("You:", user_text)

    if user_text.lower() == "exit":
        break

    response = llm.generate_content(user_text)
    reply = response.text.strip()

    speak(reply)

print("Goodbye 👋")