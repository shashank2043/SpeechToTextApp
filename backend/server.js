const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const { createClient } = require("@deepgram/sdk");
const fs = require("fs");
const path = require("path");
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Deepgram with your API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.use(cors());
app.use(express.json());

// Use authentication routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the transcription schema
const transcriptionSchema = new mongoose.Schema({
  audioUrl: String,
  text: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
app.post("/upload", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const filePath = req.file.path;
    console.log('File saved to:', filePath);

    // Read the file as a buffer
    const audioBuffer = fs.readFileSync(filePath);

    // Transcribe the audio using Deepgram
    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        punctuate: true,
        model: "nova-3",
        smart_format: true,
        language: 'en-IN',
      }
    );

    // Extract the transcription text
    const text = result.results.channels[0].alternatives[0].transcript;

    // Save the transcription to MongoDB with user reference
    const newTranscription = new Transcription({
      text,
      user: req.user._id
    });
    await newTranscription.save();

    // Delete the temporary file
    fs.unlinkSync(filePath);

    // Send the transcription back to the client
    res.json(newTranscription);
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: "Failed to process audio file" });
  }
});

// Get user's transcriptions
app.get("/transcriptions", protect, async (req, res) => {
  try {
    const transcriptions = await Transcription.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transcriptions);
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    res.status(500).json({ error: "Failed to fetch transcriptions" });
  }
});

// Clear user's transcription history
app.delete("/transcriptions", protect, async (req, res) => {
  try {
    await Transcription.deleteMany({ user: req.user._id });
    res.json({ message: "Transcription history cleared" });
  } catch (error) {
    console.error('Error clearing transcriptions:', error);
    res.status(500).json({ error: "Failed to clear transcription history" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});