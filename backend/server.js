const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const { createClient } = require("@deepgram/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Deepgram with your API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the transcription schema
const transcriptionSchema = new mongoose.Schema({
  audioUrl: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Transcription = mongoose.model("Transcription", transcriptionSchema);

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files to the "recorded" folder
    const dir = path.join(__dirname, "recorded");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload and transcribe audio
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const filePath = req.file.path; // Path to the saved file
    const mimetype = req.file.mimetype;

    console.log('File saved to:', filePath); // Log the file path

    // Transcribe the audio using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(filePath), // Read the saved file
      {
        punctuate: true,
        model: "nova-3",
        smart_format: true,
      }
    );

    if (error) throw error;

    // Extract the transcription text
    const text = result.results.channels[0].alternatives[0].transcript;

    // Save the transcription to MongoDB
    const newTranscription = new Transcription({ text });
    await newTranscription.save();

    // Optionally, delete the saved file after transcription
    fs.unlinkSync(filePath);

    // Send the transcription back to the client
    res.json({ text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch all transcriptions
app.get("/transcriptions", async (req, res) => {
  try {
    const transcriptions = await Transcription.find().sort({ createdAt: -1 });
    res.json(transcriptions);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));