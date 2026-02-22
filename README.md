# RedDrop

A premium Reddit feed reader that displays one random post at a time with AI-powered summarization via Ollama.

## Features

- **Random Post Display**: Shows one random post at a time from your configured subreddits
- **AI Summarization**: Get three types of AI summaries using Ollama:
  - Article Summary: Summarizes the post and top comments
  - Community Sentiment: What the majority of commenters think
  - Contrarian View: Dissenting opinions and alternative viewpoints
- **Subreddit Configuration**: Customize which subreddits to pull from
- **Dark Mode**: Beautiful dark theme by default
- **Mobile Friendly**: Swipe to navigate between posts on mobile
- **Auto-Refresh**: Feed refreshes every 30 minutes in the background

## Prerequisites

### Node.js

Make sure you have Node.js installed. You can check by running:

```bash
node --version
```

If you don't have Node.js, download it from [nodejs.org](https://nodejs.org/).

### Ollama

RedDrop uses [Ollama](https://ollama.ai/) for AI summarization. To install and run Ollama:

1. **Install Ollama** (macOS/Linux):
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

   **Windows**: Download the installer from [ollama.ai/download](https://ollama.ai/download)

2. **Start Ollama**:
   ```bash
   ollama serve
   ```

   Keep this terminal window open while using RedDrop.

3. **Pull a model** (if not already installed):
   ```bash
   ollama pull llama3
   ```

   Other available models include `mistral`, `codellama`, `phi3`, and more. Check available models:
   ```bash
   ollama list
   ```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the App

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open in browser**:
   - Local: http://localhost:5194
   - Network: http://YOUR_IP_ADDRESS:5194 (for other devices on your network)

The terminal will display both URLs when the server starts.

3. **Stop the app**: Press `Ctrl+C` in the terminal

## Configuration

### Subreddits

1. Click the settings icon (⚙️) in the top right
2. Enter subreddits (one per line, without the "r/" prefix)
3. Click "Save"

Default subreddits: worldnews, technology, programming, personalfinance, science

### Ollama Settings

In the settings modal, you can configure:

- **API URL**: The Ollama API endpoint (default: http://localhost:11434)
- **Model**: The AI model to use (default: llama3)

## Troubleshooting

### Ollama Not Running

If you see connection errors in the summary panel:

1. Make sure Ollama is running: `ollama serve`
2. Verify the model is installed: `ollama list`
3. Check the API URL in settings matches your Ollama configuration

### CORS Issues

If you experience CORS errors:

- This shouldn't occur with the current implementation since we're using Reddit's public API
- If issues persist, ensure no browser extensions are interfering

### Reddit Rate Limits

If you see rate limit errors:

- Wait a few minutes before refreshing
- The app automatically handles rate limiting
- Try reducing the number of subreddits in your configuration

### No Posts Available

If the feed is empty:

- Check your internet connection
- Verify the subreddit names are correct
- Some subreddits may be private or quarantined
- Try clicking "Refresh" to reload the feed

## Tech Stack

- React 19
- Vite
- CSS (no external UI libraries)
- localStorage for persistence
- Native fetch for API calls

## License

MIT
