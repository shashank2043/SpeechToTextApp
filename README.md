# 🎙️ Speech-to-Text App

A modern and efficient speech-to-text transcription web app built with **React**, **Express**, **MongoDB**, and **Deepgram API**. This app allows users to upload or record audio and get real-time transcriptions.

## 🚀 Features

✅ Upload MP3/WAV audio files for transcription  
✅ Record audio directly from the browser  
✅ Real-time transcriptions using **Deepgram API**  
✅ Store and retrieve transcriptions from **MongoDB**  
✅ Simple and intuitive UI with **React & Tailwind CSS**

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios  
- **Backend:** Node.js, Express, Multer, Deepgram API  
- **Database:** MongoDB with Mongoose  

---

## 📦 Installation & Setup

### 1️⃣ Clone the Repository
```sh
$ git clone https://github.com/shashank2043/SpeechToTextApp
$ cd SpeechToTextApp
```

### 2️⃣ Install Dependencies
#### Backend
```sh
$ cd backend
$ npm install -g nodemon  # Install nodemon globally if not installed
$ nodemon server.js
```
#### Frontend
```sh
$ cd frontend
$ npm install
```

### 3️⃣ Configure Environment Variables
Create a `.env` file in the `backend` folder and add:
```sh
PORT=5000
MONGO_URI=your-mongodb-uri
DEEPGRAM_API_KEY=your-deepgram-api-key
```

### 4️⃣ Run the Application
#### Start Backend Server
```sh
$ cd backend
$ npm start
```
#### Start Frontend
```sh
$ cd frontend
$ npm run dev
```

---

## 📌 API Endpoints

### 🔹 Upload & Transcribe Audio
**POST** `/upload`
- Uploads an audio file and returns transcribed text

### 🔹 Get Transcriptions
**GET** `/transcriptions`
- Fetches all saved transcriptions from MongoDB

---

## 🏗️ Future Enhancements

- 🔄 Live transcription while recording  
- 🎤 Support for additional audio formats  
- 🌍 Multi-language transcription support

---

## 📝 License

This project is licensed under the **MIT License**.
