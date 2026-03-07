# RedDrop - Reddit Multi-Feed App Design

## Project Overview
- **Name**: RedDrop
- **Type**: Single-page web application (React + Vite)
- **Core Functionality**: A premium Reddit feed reader that displays one random post at a time from configured subreddits with AI-powered summarization via Ollama
- **Target Users**: Reddit power users who want a curated, immersive reading experience

## UI/UX Specification

### Layout Structure

**Main View (Feed)**
- Full-viewport single card display
- Card centered vertically and horizontally
- Navigation button ("Next →") prominently placed at bottom
- Subtle swipe gesture support on mobile

**Settings Page**
- Modal overlay or separate route
- Two sections: Subreddits list, Ollama configuration
- Save/Cancel actions

**Summary Panel**
- Slide-in panel from right or bottom
- Three distinct sections for AI summaries
- Loading states per section

### Visual Design

**Color Palette (Dark Mode Default)**
- Background: `#0a0a0f` (deep dark)
- Card Background: `#16161d` (elevated surface)
- Card Border: `#2a2a35` (subtle edge)
- Primary Accent: `#ff6b4a` (warm coral - Reddit-inspired)
- Secondary Accent: `#4ecdc4` (teal for contrast)
- Text Primary: `#f0f0f5` (off-white)
- Text Secondary: `#8888a0` (muted)
- Error: `#ff4757`
- Success: `#2ed573`

**Subreddit Tag Colors** (color-coded by category)
- News/World: `#ff6b6b` (red)
- Tech: `#4ecdc4` (teal)
- Programming: `#a29bfe` (purple)
- Finance: `#00b894` (green)
- Science: `#fdcb6e` (yellow)
- Other: `#74b9ff` (blue)

**Typography**
- Font Family: `"Sora", sans-serif` (headings), `"Inter", system-ui` (body)
- Post Title: 28px, font-weight 600
- Body/Meta: 16px, font-weight 400
- Tags: 12px, uppercase, font-weight 600
- Line Height: 1.5

**Spacing**
- Card padding: 32px
- Element gaps: 16px
- Border radius: 16px (card), 8px (tags/buttons)

**Visual Effects**
- Card shadow: `0 8px 32px rgba(0,0,0,0.4)`
- Hover lift on card: translateY(-4px)
- Smooth transitions: 300ms ease-out
- Swipe animation: transform + opacity

### Components

**PostCard**
- States: loading, loaded, error, empty-pool
- Elements: thumbnail (optional), title, meta row, action buttons
- Interactions: click to open summary, swipe/click Next

**NextButton**
- States: default, hover, disabled (loading)
- Style: pill-shaped, accent color, icon + text

**SummaryPanel**
- Three sections with distinct header colors
- Loading spinner per section
- Streaming text display
- Close button

**SettingsModal**
- Textarea for subreddits (one per line)
- Input fields for Ollama URL and model name
- Save/Reset buttons

## Functionality Specification

### Core Features

**1. Feed Management**
- Fetch top 50 posts from each configured subreddit
- Fetch top 50 from Reddit global top
- Merge all into unified pool (deduplicated by post ID)
- Store in React state + ref for current position
- Background refresh every 30 minutes
- Manual refresh button

**2. Post Display**
- Random selection from pool on load
- "Next" cycles through pool randomly (not sequentially)
- Pool reshuffles when exhausted
- Display: thumbnail, title, subreddit tag, score, comments, author, time ago

**3. Subreddit Configuration**
- localStorage key: `reddrop_subreddits`
- Default: ["worldnews", "technology", "programming", "personalfinance", "science"]
- Input: newline-separated list
- Validation: remove "r/" prefix, filter empty

**4. Post Detail / Summary**
- Click post card or "Summarize" button to open
- Fetch comments: `https://www.reddit.com/r/{sub}/comments/{id}.json`
- Three parallel Ollama requests with different prompts:
  - Article Summary: "Summarize this Reddit post title, body, and top comments into 3-4 sentences..."
  - Community Sentiment: "What do most commenters think about this post? Summarize the prevailing opinion..."
  - Contrarian View: "Find and summarize the most dissenting or opposing opinions in these comments..."

**5. Ollama Integration**
- Configurable base URL (default: `http://localhost:11434`)
- Configurable model (default: `llama3`)
- Endpoint: `/api/generate`
- Streaming response handling
- Error handling for connection failures

### User Interactions
- Click "Next →" → animate out current, show next random post
- Swipe left on mobile → same as Next
- Click card or "Summarize" → open summary panel
- Click settings icon → open settings modal
- Click outside modal → close

### Data Handling
- All data in memory (no database)
- localStorage for settings only
- No authentication required

### Edge Cases
- Empty pool: show friendly message, offer refresh
- Subreddit not found: skip, show warning toast
- Private/banned subreddit: skip silently
- Rate limited: retry with backoff, show error
- Ollama not running: show connection error in summary panel
- No thumbnail: show placeholder or hide image area
- Very long titles: truncate with ellipsis (3 lines max)

## Technical Architecture

### File Structure
```
src/
├── App.jsx           # Main app, routing
├── main.jsx          # Entry point
├── index.css         # Global styles
├── components/
│   ├── PostCard.jsx      # Single post display
│   ├── SummaryPanel.jsx  # AI summary panel
│   ├── SettingsModal.jsx # Configuration modal
│   └── LoadingSpinner.jsx
├── hooks/
│   ├── useRedditFeed.js   # Feed fetching logic
│   └── useOllama.js       # Ollama API hook
├── utils/
│   ├── api.js         # Reddit API helpers
│   ├── timeAgo.js     # Time formatting
│   └── storage.js     # localStorage helpers
└── config/
    └── constants.js   # Default config
```

### API Integration

**Reddit API**
- No auth required for public feeds
- Endpoints:
  - `/r/{sub}/top.json?limit=50&t=day`
  - `/top.json?limit=50&t=day`
  - `/r/{sub}/comments/{id}.json`

**Ollama API**
- POST `/api/generate`
- Body: `{ model, prompt, stream: true }`
- Parse streaming SSE responses

## Acceptance Criteria

1. ✅ App loads and displays random post from pool
2. ✅ Next button shows next random post with animation
3. ✅ Settings modal allows subreddit configuration
4. ✅ Settings persist in localStorage
5. ✅ Summary panel opens on card click
6. ✅ All three AI summaries load (with streaming)
7. ✅ Responsive design works on mobile
8. ✅ Dark mode by default
9. ✅ Vite runs on port 5194 with host
10. ✅ Network URL printed on startup
11. ✅ README documents all features
