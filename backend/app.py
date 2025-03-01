from flask import Flask, request, jsonify, send_file
import asyncio
import os
from deepgram import Deepgram
from elevenlabs.client import ElevenLabs
from ollama import chat
from flask_cors import CORS
import re
from gtts import gTTS


# API Keys
DEEPGRAM_API_KEY = "f0c1d4112e632d5d72472738638430e5ce21d406"
MODEL_NAME = "deepseek-r1"  # Choose the correct model variant

# ELEVENLABS_API_KEY = "sk_c8f6dffd5afcea0c6ac80450542eeed5d0aec09e6f103203"
# client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

conversation_history = {}

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "output"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Function to transcribe speech using Deepgram
async def transcribe_audio(audio_path):
    deepgram = Deepgram(DEEPGRAM_API_KEY)
    with open(audio_path, "rb") as audio_file:
        response = await deepgram.transcription.prerecorded(
            {"buffer": audio_file, "mimetype": "audio/wav"}, {"punctuate": True}
        )
    print(response["results"]["channels"][0]["alternatives"][0]["transcript"])
    return response["results"]["channels"][0]["alternatives"][0]["transcript"]

# Function to generate AI response using Deepseek
def generate_response(user_input, user_id):

    prompt = f"""You are a customer support agent for Arnest. Respond professionally, provide clear help, and escalate if needed.
        Now, respond to: [Customer Inquiry]."""
    
    if user_id not in conversation_history:
        conversation_history[user_id] = []
        user_input = prompt + user_input

    conversation_history[user_id].append({"role": "user", "content": user_input})
    
    response = chat(model=MODEL_NAME, messages=conversation_history[user_id])

    assistantContent = re.sub(r'<think>.*?</think>', '', response.message.content, flags=re.DOTALL)
    
    conversation_history[user_id].append({"role": "assistant", "content": assistantContent})
    
    return assistantContent
    
# Function to convert text to speech and save as an audio file
def speak_text(response_text, output_path):
    audio = gTTS(text=response_text, lang="en", slow=False)
    audio.save(output_path)

# Route to handle audio upload and response generation
@app.route("/upload-audio", methods=["POST"])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    userId = request.form.get("user_id", "default_user")
    file = request.files["file"]
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    transcript = loop.run_until_complete(transcribe_audio(file_path))
    response_text = generate_response(transcript, userId)

    # Generate AI response audio
    audio_output_path = os.path.join(OUTPUT_FOLDER, "response.mp3")
    speak_text(response_text, audio_output_path)

    return jsonify({"response": conversation_history, "audio_url": "/get-audio"})

# Route to serve the AI-generated audio file
@app.route("/get-audio", methods=["GET"])
def get_audio():
    print("Sending audio file", conversation_history)
    return send_file(os.path.join(OUTPUT_FOLDER, "response.mp3"), mimetype="audio/mp3")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
