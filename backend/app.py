from flask import Flask, request, jsonify, send_file
import asyncio
import json
import requests
import os
from deepgram import Deepgram
from elevenlabs.client import ElevenLabs
from transformers import AutoModelForCausalLM, AutoTokenizer



# API Keys
DEEPGRAM_API_KEY = "f0c1d4112e632d5d72472738638430e5ce21d406"
ELEVENLABS_API_KEY = "sk_c8f6dffd5afcea0c6ac80450542eeed5d0aec09e6f103203"

MODEL_NAME = "deepseek-ai/DeepSeek-R1"  # Choose the correct model variant

# Load the tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)


client = ElevenLabs(ELEVENLABS_API_KEY)

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "output"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Function to transcribe speech using Deepgram
async def transcribe_audio(audio_path):
    deepgram = Deepgram(DEEPGRAM_API_KEY)
    with open(audio_path, "rb") as audio_file:
        response = await deepgram.transcription.prerecorded(
            {"buffer": audio_file}, {"punctuate": True}
        )
    return response["results"]["channels"][0]["alternatives"][0]["transcript"]

# Function to generate AI response using Deepseek
def generate_response(prompt, history=[]):
    messages = history + [{"role": "user", "content": prompt}]
    input_text = tokenizer.apply_chat_template(messages, tokenize=False)

    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to("cpu")

    output = model.generate(input_ids, max_length=512)
    response_text = tokenizer.decode(output[0], skip_special_tokens=True)
    return response_text

# Function to convert text to speech and save as an audio file
def speak_text(response_text, output_path):
    audio = client.generate(text=response_text, voice="Bella", api_key=ELEVENLABS_API_KEY)
    with open(output_path, "wb") as f:
        f.write(audio)

# Route to handle audio upload and response generation
@app.route("/upload-audio", methods=["POST"])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    transcript = loop.run_until_complete(transcribe_audio(file_path))
    response_text = generate_response(transcript)

    # Generate AI response audio
    audio_output_path = os.path.join(OUTPUT_FOLDER, "response.mp3")
    speak_text(response_text, audio_output_path)

    return jsonify({"transcript": transcript, "response": response_text, "audio_url": "/get-audio"})

# Route to serve the AI-generated audio file
@app.route("/get-audio", methods=["GET"])
def get_audio():
    return send_file(os.path.join(OUTPUT_FOLDER, "response.mp3"), mimetype="audio/mp3")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
