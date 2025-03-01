# VOCALIS

## Introduction

VOCALIS is a Flask-based Voice Agent that allows users to record their voice, transcribe it into text using Deepgram's API, generate a response using Deepseek AI, and convert the response into speech using Google Text-to-Speech (gTTS). It includes a React-based frontend for interaction.

## Technologies Used

### Backend:
- **Flask** - Web framework for Python
- **Deepgram API** - Speech-to-text transcription
- **Deepseek AI (deepseek-r1)** - AI model for generating responses
- **Ollama Server** - Hosts the Deepseek-r1 model locally
- **Google Text-to-Speech (gTTS)** - Converts text to speech
- **Flask-CORS** - Handles cross-origin requests

### Frontend:
- **React.js** - Frontend framework
- **Axios** - Handles API requests
- **Media Recorder API** - Captures audio from the user

## Features

### Backend:
- **Audio Upload and Transcription**
- **AI Response Generation**
- **Text-to-Speech Conversion**
- **Conversation History Management**
- **RESTful API Endpoints:**
  - `/upload-audio`: Accepts audio, transcribes it, generates a response, and provides an audio reply.
  - `/get-audio`: Serves the generated AI response audio file.

### Frontend:
- **Voice Recording**
- **API Integration**
- **Audio Playback**
- **Processing Loader**

## Installation & Setup

### Backend:
```sh
pip install -r requirements.txt
python app.py  # Run Flask
```

### Frontend:
```sh
npm install
npm start
```

## Future Enhancements

- Support for multiple languages.
- Improved UI/UX.
- Context-aware AI responses.
- Deployment with Docker and cloud services.
