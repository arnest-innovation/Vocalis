from flask import Flask, request, jsonify, send_file
import asyncio
import json
import requests
import os
from deepgram import Deepgram
from elevenlabs.client import ElevenLabs
from ollama import chat
from flask_cors import CORS
import re


# API Keys
DEEPGRAM_API_KEY = "f0c1d4112e632d5d72472738638430e5ce21d406"
ELEVENLABS_API_KEY = "sk_c8f6dffd5afcea0c6ac80450542eeed5d0aec09e6f103203"
MODEL_NAME = "deepseek-r1"  # Choose the correct model variant

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
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
    print(response)
    return response["results"]["channels"][0]["alternatives"][0]["transcript"]

# Function to generate AI response using Deepseek
def generate_response(user_input, user_id):
    if user_id not in conversation_history:
        conversation_history[user_id] = []
    
    conversation_history[user_id].append({"role": "user", "content": user_input})
    
    response = chat(model=MODEL_NAME, messages=conversation_history[user_id])

    assistantContent = re.sub(r'<think>.*?</think>', '', response.message.content, flags=re.DOTALL)
    
    conversation_history[user_id].append({"role": "assistant", "content": assistantContent})
    
    return assistantContent
    
# Function to convert text to speech and save as an audio file
def speak_text(response_text, output_path):
    audio = client.generate(text=response_text, voice="2yEwOXNJow56OfkHEOM9")
    with open(output_path, "wb") as f:
        for chunk in audio:  # Iterate through the generator
            f.write(chunk)


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

    return jsonify({"transcript": transcript, "response": response_text, "audio_url": "/get-audio"})

# Route to serve the AI-generated audio file
@app.route("/get-audio", methods=["GET"])
def get_audio():
    print("Sending audio file", conversation_history)
    return send_file(os.path.join(OUTPUT_FOLDER, "response.mp3"), mimetype="audio/mp3")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
