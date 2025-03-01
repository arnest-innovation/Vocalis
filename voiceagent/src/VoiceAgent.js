import { useState, useRef } from "react";
import axios from "axios";

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
      setAudioUrl(null);
      const userId = "manoj";
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", audioBlob, "recorded_audio.wav");
      formData.append("user_id", userId);

      setResponse("Processing...");

      try {
        const res = await axios.post(
          "http://127.0.0.1:5000/upload-audio",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const data = res.data;
        setResponse(data.response[userId]);
        console.log(data.response[userId], "faya");
        setAudioUrl("http://127.0.0.1:5000/get-audio"); // Set audio URL

        // Play the response audio automatically
        // const audio = new Audio("http://127.0.0.1:5000/get-audio");
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {response && Array.isArray(response) ? (
        response.map((res) => {
          return <p>{res.content}</p>;
        })
      ) : (
        <p>{response}</p>
      )}

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
