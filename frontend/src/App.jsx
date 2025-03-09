import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [audio, setAudio] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // Fetch transcriptions on component mount
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/transcriptions`)
      .then((res) => setTranscriptions(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "audio/mpeg" || file.type === "audio/wav")) {
      setAudio(file);
      setError(null);
    } else {
      setError("Invalid file type. Please upload an MP3 or WAV file.");
    }
  };

  // Handle file upload
  const handleUpload = async (file) => {
    if (!file) {
      setError("No audio file selected or recorded.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setTranscriptions([res.data, ...transcriptions]);
      setAudio(null);
      setAudioBlob(null);
    } catch (error) {
      console.error("Upload Error:", error);
      setError("Failed to upload and transcribe the audio.");
    }
    setLoading(false);
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const recordedFile = new File([blob], "recorded_audio.wav", {
          type: "audio/wav",
        });
        setAudioBlob(recordedFile);
        stream.getTracks().forEach((track) => track.stop()); // Stop the microphone stream

        console.log("Recorded file:", recordedFile); // Log the recorded file

        // Automatically upload and transcribe the recorded file
        handleUpload(recordedFile);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(
        "Failed to access microphone. Please ensure permissions are granted."
      );
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">
          Speech-to-Text Transcription
        </h1>
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-2 block w-full border p-2 rounded"
          accept=".mp3,.wav"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleUpload.bind(null, audio)}
          className="w-full bg-blue-500 text-white py-2 rounded mt-2 hover:bg-blue-600 transition"
          disabled={loading || (!audio && !audioBlob)}
        >
          {loading ? "Transcribing..." : "Upload & Transcribe"}
        </button>
        <div className="mt-4 flex justify-center gap-4">
          {recording ? (
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
            >
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
              Start Recording
            </button>
          )}
        </div>
      </div>
      <div className="mt-6 w-full max-w-md">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transcriptions</h2>
          <button
            onClick={async () => {
              try {
                await axios.delete(
                  `${import.meta.env.VITE_BACKEND_URL}/transcriptions`
                );
                setTranscriptions([]);
              } catch (error) {
                console.error("Error clearing history:", error);
                setError("Failed to clear transcription history.");
              }
            }}
            className="bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600 transition"
            disabled={transcriptions.length === 0}
          >
            Clear History
          </button>
        </div>
        <ul className="mt-2 space-y-2">
          {transcriptions.map((t, index) => (
            <li key={index} className="bg-white p-3 shadow rounded-lg border">
              {t.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
