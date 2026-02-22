// Default subreddits to fetch from
export const DEFAULT_SUBREDDITS = [
  'worldnews',
  'technology',
  'programming',
  'personalfinance',
  'science'
]

// Reddit API
export const REDDIT_API_BASE = 'https://www.reddit.com'
export const POSTS_PER_SUBREDDIT = 50

// Ollama defaults
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama3'

// localStorage keys
export const STORAGE_KEYS = {
  SUBREDDITS: 'reddrop_subreddits',
  OLLAMA_URL: 'reddrop_ollama_url',
  OLLAMA_MODEL: 'reddrop_ollama_model'
}

// UI Constants
export const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes
