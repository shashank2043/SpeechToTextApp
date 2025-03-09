import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from './lib/AuthContext';

function App() {
  const [audio, setAudio] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch transcriptions on component mount
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/transcriptions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((res) => setTranscriptions(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

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

    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            {/* Your main app content */}
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
