// import express from 'express';
// import fetch from 'node-fetch'; // Import node-fetch for API calls
// import { fileURLToPath } from 'url'; // Import fileURLToPath to handle paths in ES modules
// import path from 'path'; // Import path module
// import cors from 'cors'; // Import CORS for handling cross-origin requests

// // Initialize the express app
// const app = express();

// // Enable CORS for all requests
// app.use(cors());

// // Get the directory name from import.meta.url for ES modules
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Middleware to parse incoming JSON requests
// app.use(express.json());

// // Serve static files from the 'calmya' folder
// app.use(express.static(path.join(__dirname, 'calmya'))); // Adjust the path to the correct folder

// // Replace YOUR_HUGGINGFACE_API_TOKEN with your actual token
// const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
// const HUGGINGFACE_API_TOKEN = "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";

// // Define the POST route for handling chatbot messages
// app.post('/api/chat', async (req, res) => {
//   const userMessage = req.body.message; // Get the user's input message

//   console.log('Received message:', userMessage); // Log for debugging
  
//   try {
//     // Make request to Hugging Face API with user's message
//     const response = await fetch(HUGGINGFACE_API_URL, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ inputs: userMessage }), // Send user message
//     });

//     const responseData = await response.json(); // Parse the response from the API
//     console.log('Response from Hugging Face API:', responseData); // Log the full response

//     // Directly use the generated_text as the bot's reply
//     if (responseData && responseData[0] && responseData[0].generated_text) {
//       const botReply = responseData[0].generated_text; // Get the generated text from the API response
//       res.json({ reply: botReply }); // Send the response back to the client
//       console.log('Sending reply to client:', botReply);
//     } else {
//       // If no generated text is found, send a fallback reply
//       res.json({ reply: "Sorry, I couldn't understand that." });
//     }
//   } catch (error) {
//     console.error('Error with Hugging Face API:', error);
//     res.status(500).json({ reply: "Sorry, I'm having trouble responding right now." }); // Handle error
//   }
// });

// // Start the server on port 3000
// app.listen(3000, () => console.log('Server running on http://localhost:3000'));


import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'calmya')));

const HUGGINGFACE_API_TOKEN = "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";
const YOUTUBE_API_KEY = "AIzaSyAbce02jdZG0o9md3xUwecfc80lLEibdDo";

const HUGGINGFACE_CHATBOT_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
const HUGGINGFACE_SENTIMENT_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";
const HUGGINGFACE_TEXTGEN_URL = "https://api-inference.huggingface.co/models/gpt2";
const QUOTE_API_URL = "https://zenquotes.io/api/random";

// Chatbot Route
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message.toLowerCase(); // Normalize input
  console.log('User:', userMessage);

  try {
      // Sentiment Analysis
      const sentimentRes = await fetch(HUGGINGFACE_SENTIMENT_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: userMessage }),
      });
      const sentimentData = await sentimentRes.json();
      const sentiment = sentimentData[0]?.label || "neutral";

      // Chatbot Response
      const chatRes = await fetch(HUGGINGFACE_CHATBOT_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: userMessage }),
      });
      const chatData = await chatRes.json();
      const botReply = chatData[0]?.generated_text || "I didn't quite understand that.";

      let additionalRecommendation = null;

      // Check for keywords to trigger extra content
      if (userMessage.includes("motivation") || userMessage.includes("inspire")) {
          const quoteRes = await fetch(QUOTE_API_URL);
          const quoteData = await quoteRes.json();
          additionalRecommendation = `Here's a motivational quote: "${quoteData[0].q}" - ${quoteData[0].a}`;
      } else if (userMessage.includes("meditate") || userMessage.includes("breathing")) {
          const ytRes = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&q=guided+meditation+mindfulness+breathing&type=video&maxResults=5&key=AIzaSyAbce02jdZG0o9md3xUwecfc80lLEibdDo');
          const ytData = await ytRes.json();
          additionalRecommendation = `Try this meditation video: https://www.youtube.com/watch?v=${ytData.items[0].id.videoId}`;
      }

      res.json({ reply: botReply, sentiment, recommendation: additionalRecommendation });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ reply: "Something went wrong." });
  }
});


// Text Generation Route
app.post('/api/generate', async (req, res) => {
    const prompt = req.body.prompt;
    try {
        const response = await fetch(HUGGINGFACE_TEXTGEN_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt }),
        });
        const data = await response.json();
        res.json({ generatedText: data[0]?.generated_text });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate text' });
    }
});

// Daily Quote Route
app.get('/api/quote', async (req, res) => {
    try {
        const response = await fetch(QUOTE_API_URL);
        const data = await response.json();
        res.json({ quote: data[0].q, author: data[0].a });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

// YouTube Meditation Videos Route
app.get('/api/youtube', async (req, res) => {
    try {
        const response = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&q=guided+meditation+mindfulness+breathing&type=video&maxResults=5&key=AIzaSyAbce02jdZG0o9md3xUwecfc80lLEibdDo');
        const data = await response.json();
        res.json({ videos: data.items.map(item => ({ title: item.snippet.title, videoId: item.id.videoId })) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Start Server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
