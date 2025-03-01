import { useState, useRef } from "react";
import axios from "axios";
import "./VoiceAgent.css";
export default function VoiceAgent() {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setAudioUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsLoading(true);
        const userId = "manoj";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const formData = new FormData();
        formData.append("file", audioBlob, "recorded_audio.wav");
        formData.append("user_id", userId);

        try {
          const res = await axios.post(
            "http://127.0.0.1:5000/upload-audio",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          const data = res.data;
          setResponse(data.response[userId]); // Fixed incorrect indexing
          const currentTime = Date.now();
          setAudioUrl(
            `http://localhost:5000/get-audio?currentTime=${currentTime}`
          );
        } catch (error) {
          console.error("Error:", error);
          setResponse("Error occurred");
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
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
        <h5 className="sticky-header">User</h5>
        {response &&
          response
            ?.filter((type) => type.role === "user")
            ?.map((item, index) => (
              <div key={index} className="content">
                {item.content}
              </div>
            ))}
      </div>
      {isLoading === true ? (
        <div className="box mix loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div class="box mix">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            class="glow-on-hover"
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
          {audioUrl && !isLoading && (
            <audio controls autoPlay>
              <source src={audioUrl} type="audio/mp3" />` Your browser does not
              support the audio tag. `{" "}
            </audio>
          )}
        </div>
      )}
      <div class="box client">
        <h5 className="sticky-header">Assistant</h5>

        {response &&
          response
            ?.filter((type) => type.role === "assistant")
            ?.map((item, index) => (
              <div className="content" key={index}>
                {item.content.slice(0, 500)}
              </div>
            ))}
      </div>
    </div>
  );
}
