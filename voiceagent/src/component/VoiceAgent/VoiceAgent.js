import { useState, useRef } from "react";
import "./VoiceAgent.css";
export default function VoiceAgent() {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", audioBlob, "recorded_audio.wav");

      setResponse("Processing...");

      try {
        const res = await fetch("http://localhost:5000/upload-audio", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setResponse(data.response);
        setAudioUrl("http://localhost:5000/get-audio"); // Set audio URL

        // Play the response audio automatically
        const audio = new Audio("http://localhost:5000/get-audio");
        audio.play();
      } catch (error) {
        console.error("Error:", error);
        setResponse("Error occurred");
      }
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="container">
      <div className="box recorder">
        {/* <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          class="glow-on-hover"
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button> */}
        user
        {/* <p className="mt-4 text-lg font-semibold">{response}</p> */}
      </div>
      <div class="box mix">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          class="glow-on-hover"
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <div class="box client">client</div>

      {/* Show a play button if audio is available */}
      {audioUrl && (
        <audio controls autoPlay>
          <source src={audioUrl} type="audio/mp3" />` Your browser does not
          support the audio tag. `{" "}
        </audio>
      )}
    </div>
  );
}
