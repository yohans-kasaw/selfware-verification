# Gemini Personality Experiment Lab

Welcome to the **Experiment Lab**! This project is designed to help you rigorously blind-test and evaluate different AI personality profiles using Google's Gemini API. 

## The Idea of the Experiment

When testing different system prompts or "personalities" for Large Language Models (LLMs), it's easy to be biased if you know which profile is generating the response. The **Experiment Lab** removes this bias through a structured, multi-round blind test.

In this lab, you pit 4 distinct AI profiles against each other. They are all fed the exact same complex, thought-provoking prompt, and their responses are presented to you in a shuffled, anonymous format. You rate the responses based purely on their quality. After completing several rounds of testing across different topics, the application reveals which personality profile performed the best overall.

## Step-by-Step Guide: How the Experiment Works

1. **Setup Your Environment**: Enter your Gemini API key and select the AI model you want to use (e.g., `gemini-3.1-pro-preview`) from the global settings bar at the top of the app.
2. **Configure the Round**: 
   * Select a main topic and a specific subtopic from the provided dropdowns, or enter your own custom topics.
   * Adjust the "Generated Prompt Word Limit" to dictate how long the resulting responses should be.
3. **Generate a Prompt**: Click the "Generate Challenging Prompt" button. The system will use a fast model to craft a complex scenario or instruction based on your selected topic.
4. **Review & Edit**: You can review the generated prompt and edit it manually if you'd like to tweak the constraints or add more context.
5. **Run the Blind Test**: Click "Run Experiment with all Profiles". The application will send the prompt to all 4 personality profiles simultaneously.
6. **Rate the Responses**: The responses from the 4 profiles will appear below in a shuffled order. Read through each response carefully and use the star rating system (1-5 stars) to score them based on your preference and the quality of the answer.
7. **Submit & Proceed**: Once you've rated all responses, submit your scores to move on to the next round.
8. **View Final Results**: After completing 5 rounds, the experiment concludes. The application will tally your blind scores and reveal a leaderboard showing which personality profile was the overall winner.

---

## How to Get a Gemini API Key

To use this application, you need a free API key from Google AI Studio. Here's how to get one:

1. **Go to Google AI Studio**: Visit [aistudio.google.com](https://aistudio.google.com/).
2. **Sign In**: Log in with your Google account.
3. **Get API Key**: On the left-hand sidebar or at the top of the dashboard, look for a button that says **"Get API key"**.
4. **Create API Key**: Click the **"Create API key"** button. If prompted, select a Google Cloud project to associate the key with (or let it create a new default project for you).
5. **Copy Your Key**: Once generated, copy the long string of characters (your API key). Treat this like a password and do not share it publicly.
6. **Add to the App**: You can paste this key directly into the "API Key" input field at the top of the Experiment Lab interface. 
   * *Alternative*: For a persistent setup, you can create a `.env.local` file in the root of this project folder and add your key like this: `VITE_GEMINI_API_KEY="your-api-key-here"`.

---

## Running the Project Locally

If you are setting this up for the first time on your own machine:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the local address provided in the terminal (usually `http://localhost:5173`).