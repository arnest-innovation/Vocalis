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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      setIsLoading(true);
      setAudioUrl(null);

      const userId = "manoj";
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/wav",
      });
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
        setIsLoading(false);
        // Play the response audio automatically
        // const audio = new Audio("http://127.0.0.1:5000/get-audio");
      } catch (error) {
        console.error("Error:", error);
        setResponse("Error occurred");
        setIsLoading(false);
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
        {/* {response?.filter((item) =>
          item.role === "user" ? <div>{item.content} </div> : ""
        )} */}
        {/* <p className="mt-4 text-lg font-semibold">{response}</p> */}
      </div>
      {isLoading === true ? (
        <div class="box mix">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/KTonvXhsxpc?si=Gc2IHf43bDnMz53Q"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
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
          {audioUrl && (
            <audio controls autoPlay>
              <source src={audioUrl} type="audio/mp3" />` Your browser does not
              support the audio tag. `{" "}
            </audio>
          )}
        </div>
      )}
      <div class="box client">
        client
        {response && Array.isArray(response) ? (
          response.map((res) => {
            return <p>{res.content}</p>;
          })
        ) : (
          <p>{response}</p>
        )}
      </div>

      {/* Show a play button if audio is available */}
      {/* {audioUrl && (
        <audio controls autoPlay>
          <source src={audioUrl} type="audio/mp3" />` Your browser does not
          support the audio tag. `{" "}
        </audio>
      )} */}
    </div>
  );
}
