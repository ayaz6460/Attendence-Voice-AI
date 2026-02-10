import os
import json
import base64
import asyncio
import subprocess
import websockets
import whisper
import platform
import shutil
import google.generativeai as genai
from fastapi import FastAPI, WebSocket, Request, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, Response
from twilio.twiml.voice_response import VoiceResponse, Connect
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Configuration
PORT = int(os.getenv("PORT", 8001))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_NUMBER = os.getenv("TWILIO_NUMBER")
NGROK_URL = os.getenv("NGROK_URL") # In production, set this to your Render URL (e.g. https://xyz.onrender.com)

# Cross-Platform Binary Paths
if platform.system() == "Windows":
    # User specified location for Windows
    os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\bin"
    PIPER_EXE = r"C:\piper\piper.exe"
    VOICE_MODEL = r"C:\piper\voices\en_US-lessac-medium.onnx"
else:
    # Linux / Docker paths
    PIPER_EXE = "./piper/piper" # Assumes piper is in app root or accessible
    VOICE_MODEL = "./en_US-lessac-medium.onnx"

# Auto-start Ngrok if not set AND we are on local Windows (optional check)
if not NGROK_URL and platform.system() == "Windows":
    try:
        from pyngrok import ngrok
        print("NGROK_URL not found. Attempting to start ngrok tunnel...")
        tunnel = ngrok.connect(PORT)
        NGROK_URL = tunnel.public_url
        print(f"Ngrok Tunnel Started: {NGROK_URL}")
    except Exception as e:
        print(f"Could not start ngrok: {e}")

OUTPUT_WAV = "response.wav"
OUTPUT_MULAW = "response.mulaw"

# AI Config
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "AIzaSyDIXFi83mOj5FRSLkYo731VRQdvmieCQNQ"))
llm = genai.GenerativeModel("gemini-2.5-flash")

print("Loading Whisper...")
stt_model = whisper.load_model("base")
print("Whisper loaded")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Robust Manual CORS Middleware to ensure headers are always present
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception as e:
        response = JSONResponse({"error": str(e)}, status_code=500)
        
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Supabase init
from supabase import create_client, Client as SupabaseClient
supabase: SupabaseClient = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/students")
async def get_students():
    try:
        # 1. Fetch Students
        students_res = supabase.table("students").select("*").execute()
        students = students_res.data
        
        # 2. Fetch Today's Attendance
        from datetime import date
        today = str(date.today())
        attendance_res = supabase.table("attendance").select("*").eq("date", today).execute()
        attendance_map = {a['student_roll']: a for a in attendance_res.data}
        
        # 3. Merge Data
        for s in students:
            record = attendance_map.get(s['roll'])
            if record:
                s['status'] = record.get('status', 'Absent')
                s['reason'] = record.get('reason', '')
                s['transcript'] = record.get('transcript', '')
            else:
                s['status'] = 'Absent' # Default to Absent if no record found/or use 'Present' based on logic
                # Actually user wants to manage attendance. 
                # If no record exists, they are technically "Unknown" or present defaults?
                # The dashboard uses "Present" as default in UI if not set, let's allow dashboard to decide or set default here.
                # Let's set default to "Present" to match typical flow, usually you mark absents.
                s['status'] = 'Present' 
                
        return students
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/start-call")
async def start_call(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    to_number = data.get("phone")
    roll = data.get("roll")
    
    # OVERRIDE: Use verified number for testing as per user request
    to_number = "+916304334300"
    
    if not change_to_e164(to_number):
         return JSONResponse({"error": "Invalid phone number"}, status_code=400)

    # In production, use `to_number` directly if verified or if using a paid account
    to_number = "+916304334300" 
    
    print(f"Initiating call to: {to_number} ({roll})")

    try:
        call = twilio_client.calls.create(
            to=to_number,
            from_=TWILIO_NUMBER,
            url=f"{NGROK_URL}/twiml?roll={roll}"
        )
        return {"status": "success", "call_sid": call.sid}
    except Exception as e:
        print(f"Twilio Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/students")
async def add_student(request: Request):
    try:
        data = await request.json()
        print(f"Adding student: {data}")
        # Basic validation
        if not data.get('roll') or not data.get('name') or not data.get('phone'):
             return JSONResponse({"error": "Missing fields"}, status_code=400)
             
        res = supabase.table("students").insert(data).execute()
        return res.data
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.delete("/students/{roll}")
async def delete_student(roll: str):
    try:
        print(f"Deleting student: {roll}")
        # Delete dependent attendance records first? Or let cascade handle it?
        # Supabase/Postgres foreign key usually restricts delete unless cascade is on.
        # Let's try deleting user.
        res = supabase.table("students").delete().eq("roll", roll).execute()
        return res.data
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/history")
async def get_history():
    try:
        # Fetch all attendance records, ordered by date desc
        # Also join with students to get names
        from supabase.lib.query_builder import QueryBuilder
        response = supabase.table("attendance").select("*, students(name, parent_name)").order("date", desc=True).limit(50).execute()
        return response.data
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/twiml")
async def twiml(request: Request):
    # Prepare TwiML
    host = request.headers.get('host')
    roll = request.query_params.get("roll", "")
    response = VoiceResponse()
    connect = Connect()
    stream = connect.stream(url=f"wss://{host}/stream?roll={roll}")
    # Pass metadata if needed
    response.append(connect)
    return Response(content=str(response), media_type="application/xml")

# FULL AI IMPLEMENTATION
@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected")
    
    import audioop
    import time
    
    # VAD Constants
    CHUNK_SIZE = 160
    RMS_THRESHOLD = 300 
    SILENCE_LIMIT_SPEECH_END = 60  # 1.2s - Patient
    SILENCE_LIMIT_TIMEOUT = 500    # 10.0s - Very patient
    
    silence_frames = 0
    speech_detected_in_turn = False
    
    stream_sid = None
    ignore_vad_until = 0

    # Initialize Chat Session with Persona
    system_instruction = """
    You are Priya, a friendly and warm college attendance clerk.
    Your goal is to kindly find out the reason for a student's absence.
    
    Conversation Flow:
    1. Start with a warm greeting: "Hello! This is Priya calling from the College Attendance Desk. Good morning!"
    2. Ask politely who you are speaking with: "Am I speaking with the parent or the student?"
    3. Listen to their answer. If they say "Parent" or "Student", acknowledge it naturally (e.g., "Oh, hello!", "Ah, nice to speak with you.").
    4. Gently ask for the reason for the absence: "I noticed the student was absent today. May I know the reason?"
    5. Listen to the reason. Be empathetic. (e.g., "Oh, I see.", "I hope everything is okay.").
    6. Confirm you have noted it down.
    7. ONLY THEN, say "Thank you so much. Have a wonderful day!" and wait for them to say goodbye or hang up.
    
    CRITICAL RULES:
    - **NEVER** end the call immediately after getting the reason. Always wish them a good day first.
    - **NEVER** use the <END_CALL> tag until you have said "Goodbye" AND the user has had a chance to reply or say goodbye back.
    - Use natural fillers like "um," "uh," "ah," "let me see," to sound human.
    - If you are interrupted or don't understand, politely ask: "Oh, sorry, I didn't catch that."
    - Keep responses short (1-2 sentences) so the user can speak.
    - Sound warm, not robotic. Vary your phrasing.
    - **DO NOT** use asterisks or markdown formatting (like *smiles*, *nods*). Speak only the words to be spoken.
    
    DATA EXTRACTION:
    - When you have successfully understood the reason for absence, output it inside a tag: <REASON>reason text here</REASON>.
    - Do this BEFORE the <END_CALL> tag.
    
    ENDING THE CONVERSATION:
    - Only output <END_CALL> after you have said clear closing words like "Goodbye" or "Have a great day".
    """
    
    chat_session = None
    
    try:
        chat_session = llm.start_chat(history=[
            {"role": "user", "parts": [system_instruction]},
            {"role": "model", "parts": ["Understood. I will speak naturally as Priya, without using asterisks or markdown, and I will extract the reason using the REASON tag."]}
        ])
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"CRITICAL LLM INIT ERROR: {e}\n")
        print(f"CRITICAL LLM INIT ERROR: {e}")

    async def play(text):
        nonlocal ignore_vad_until
        import re
        
        # Clean text for TTS
        # 1. Extract and Save Reason if present
        reason_match = re.search(r'<REASON>(.*?)</REASON>', text)
        if reason_match:
            raw_reason = reason_match.group(1).strip()
            print(f"CAPTURED REASON: {raw_reason}")
            
            # Summarize Reason
            final_reason = raw_reason
            try:
                # Trigger a quick summarization
                print("Summarizing reason...")
                summary_prompt = f"Summarize this absence reason into 2-5 words (e.g. 'Viral Fever', 'Attending Wedding', 'Medical Emergency'). Reason: {raw_reason}"
                summary_resp = llm.generate_content(summary_prompt)
                final_reason = summary_resp.text.strip()
                print(f"Summarized: {final_reason}")
            except Exception as e:
                print(f"Summarization failed: {e}")

            # Prepare Transcript
            full_transcript = "\n".join(transcript_log)
            
            # DB INSERT
            try:
                 roll = websocket.query_params.get("roll")
                 if roll:
                     from datetime import date
                     print(f"Updating DB for roll: {roll}")
                     # Upsert or Insert
                     supabase.table("attendance").insert({
                         "student_roll": roll,
                         "status": "ABSENT",
                         "reason": final_reason,
                         "transcript": full_transcript,
                         "date": str(date.today())
                     }).execute()
                     print("DB Update Successful")
                 else:
                     print("No role found in query params")
            except Exception as e:
                 print(f"DB Error: {e}")

        # 2. Remove tags
        speech_text = text.replace("<END_CALL>", "")
        speech_text = re.sub(r'<REASON>.*?</REASON>', '', speech_text)
        
        # 3. Remove text between asterisks (e.g. *laughs*)
        speech_text = re.sub(r'\*.*?\*', '', speech_text)
        # 4. Remove standalone asterisks or markdown
        speech_text = speech_text.replace("*", "").strip()
        
        if not speech_text: return

        duration = await speak_text(websocket, stream_sid, speech_text)
        if duration > 0:
            ignore_vad_until = time.time() + duration + 0.6
            print(f"Ignoring VAD for {duration:.2f}s")

    # Initial Greeting (Generated by standard flow or pre-seeded to save latency)
    # We'll trigger the first turn manually to ensure consistent start
    first_turn = True
    transcript_log = [] # [NEW] Accumulate transcript

    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data['event'] == 'start':
                print("Stream started")
                stream_sid = data['streamSid']
                buffer = bytearray()
                silence_frames = 0
                speech_detected_in_turn = False
                
                # Trigger opening
                if chat_session:
                    try:
                        response = chat_session.send_message("Start the call now. Introduce yourself.")
                        print(f"AI: {response.text}")
                        transcript_log.append(f"AI: {response.text}") # Log
                        await play(response.text)
                    except Exception as e:
                        with open("error_log.txt", "a") as f:
                            f.write(f"LLM OPENING ERROR: {e}\n")
                        fallback_text = "Hello, good morning. This is Priya from the attendance desk. Could you please confirm if you are the parent or the student?"
                        transcript_log.append(f"AI: {fallback_text}")
                        await play(fallback_text)
                else:
                    fallback_text = "Hello, good morning. This is Priya from the attendance desk. ... I am having trouble connecting to my brain. ... Could you please confirm if you are the parent or the student?"
                    transcript_log.append(f"AI: {fallback_text}")
                    await play(fallback_text)
                
                first_turn = False

            elif data['event'] == 'media':
                if time.time() < ignore_vad_until:
                    continue

                payload = data['media']['payload']
                chunk = base64.b64decode(payload)
                buffer.extend(chunk)
                
                try:
                    pcm_chunk = audioop.ulaw2lin(chunk, 2)
                    rms = audioop.rms(pcm_chunk, 2)
                except Exception:
                    rms = 0

                if rms > RMS_THRESHOLD:
                    silence_frames = 0
                    speech_detected_in_turn = True
                else:
                    silence_frames += 1
                
                # CHECK 1: End of user speech
                if speech_detected_in_turn and silence_frames > SILENCE_LIMIT_SPEECH_END:
                    print("End of speech detected. Processing...")
                    
                    audio_data = bytes(buffer)
                    buffer = bytearray()
                    silence_frames = 0
                    speech_detected_in_turn = False
                    
                    ignore_vad_until = time.time() + 20.0 
                    
                    loop = asyncio.get_event_loop()
                    user_text = await loop.run_in_executor(None, transcribe_audio, audio_data)
                    print(f"User: {user_text}")
                    if user_text.strip():
                        transcript_log.append(f"User: {user_text}") # Log
                    
                    # Unblock VAD
                    ignore_vad_until = 0
                    
                    if not user_text.strip():
                        print("Empty transcript.")
                        continue

                    # Send to Gemini
                    if chat_session:
                        try:
                            ai_response = chat_session.send_message(user_text)
                            response_text = ai_response.text
                            print(f"AI: {response_text}")
                            transcript_log.append(f"AI: {response_text}") # Log
                            
                            await play(response_text)
                            
                            if "<END_CALL>" in response_text:
                                print("Call Ended by AI.")
                                await asyncio.sleep(2.0)
                                await websocket.close()
                                break
                                
                        except Exception as e:
                            with open("error_log.txt", "a") as f:
                                f.write(f"LLM LOOP ERROR: {e}\n")
                            print(f"LLM Loop Error: {e}")
                            await play("I'm sorry, I'm having a little trouble hearing you. Could you say that again?")
                    else:
                        await play("I apologize, my system is currently offline. Please try again later.")
                        await asyncio.sleep(2)
                        await websocket.close()
                        break

                # CHECK 2: Timeout
                elif not speech_detected_in_turn and silence_frames > SILENCE_LIMIT_TIMEOUT:
                    print("Timeout...")
                    silence_frames = 0 
                    # Nudge the AI to speak
                    try:
                        ai_response = chat_session.send_message("(The user has been silent for a while. Politely check if they are there.)")
                        await play(ai_response.text)
                    except Exception:
                        pass
                
    except Exception as e:
        print(f"WebSocket error: {e}")

def transcribe_audio(audio_data):
    try:
        with open("input.mulaw", "wb") as f:
            f.write(audio_data)
            
        subprocess.run([
            "ffmpeg", "-y", "-f", "mulaw", "-ar", "8000", "-ac", "1", 
            "-i", "input.mulaw", "-ar", "16000", "-ac", "1", "input.wav"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        result = stt_model.transcribe("input.wav")
        return result["text"].strip()
    except Exception as e:
        print(f"Transcribe Error: {e}")
        return ""

async def speak_text(websocket, stream_sid, text):
    print(f"Speaking: {text}")
    # Piper generation (English)
    cmd = [PIPER_EXE, "--model", VOICE_MODEL, "--output_file", OUTPUT_WAV]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    proc.communicate(input=text.encode('utf-8'))
    
    # Convert to Mulaw
    subprocess.run([
        "ffmpeg", "-y", "-i", OUTPUT_WAV, 
        "-f", "mulaw", "-ar", "8000", "-ac", "1", 
        OUTPUT_MULAW
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    if os.path.exists(OUTPUT_MULAW):
        size = os.path.getsize(OUTPUT_MULAW)
        duration = size / 8000.0
        
        with open(OUTPUT_MULAW, "rb") as f:
            audio_data = f.read()
        
        payload = base64.b64encode(audio_data).decode("utf-8")
        
        msg = {
            "event": "media",
            "streamSid": stream_sid,
            "media": {
                "payload": payload
            }
        }
        await websocket.send_text(json.dumps(msg))
        return duration
    else:
        print("Error: Audio generation failed")
        return 0

def change_to_e164(number):
    if not number.startswith('+'):
        return f"+91{number}" 
    return number

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
