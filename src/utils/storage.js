import {
  DEFAULT_SUBREDDITS,
  STORAGE_KEYS,
  DEFAULT_OLLAMA_URL,
  DEFAULT_OLLAMA_MODEL
} from '../config/constants'

export function getSubreddits() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBREDDITS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load subreddits from localStorage:', e)
  }
  return DEFAULT_SUBREDDITS
}

export function setSubreddits(subreddits) {
  localStorage.setItem(STORAGE_KEYS.SUBREDDITS, JSON.stringify(subreddits))
}

export function getOllamaConfig() {
  try {
    return {
      url: localStorage.getItem(STORAGE_KEYS.OLLAMA_URL) || DEFAULT_OLLAMA_URL,
      model: localStorage.getItem(STORAGE_KEYS.OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL
    }
  } catch {
    return { url: DEFAULT_OLLAMA_URL, model: DEFAULT_OLLAMA_MODEL }
  }
}

export function setOllamaConfig(url, model) {
  localStorage.setItem(STORAGE_KEYS.OLLAMA_URL, url)
  localStorage.setItem(STORAGE_KEYS.OLLAMA_MODEL, model)
}

export function getCachedPosts() {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.POSTS_TIMESTAMP)
    const posts = localStorage.getItem(STORAGE_KEYS.POSTS)
    if (!timestamp || !posts) return null
    return { posts: JSON.parse(posts), timestamp: Number(timestamp) }
  } catch {
    return null
  }
}

export function setCachedPosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
    localStorage.setItem(STORAGE_KEYS.POSTS_TIMESTAMP, Date.now().toString())
  } catch (e) {
    console.warn('Failed to cache posts:', e)
  }
}

export function getSummary(postId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUMMARIES) || '{}')
    return all[postId] || null
  } catch {
    return null
  }
}

export function setSummary(postId, summaries) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUMMARIES) || '{}')
    all[postId] = summaries
    localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(all))
  } catch (e) {
    console.warn('Failed to cache summary:', e)
  }
}

export function clearPostsAndSummaries() {
  try {
    localStorage.removeItem(STORAGE_KEYS.POSTS)
    localStorage.removeItem(STORAGE_KEYS.POSTS_TIMESTAMP)
    localStorage.removeItem(STORAGE_KEYS.SUMMARIES)
  } catch (e) {
    console.warn('Failed to clear cache:', e)
  }
}

export function replacePostsAndSummaries(posts, summariesDict) {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
    localStorage.setItem(STORAGE_KEYS.POSTS_TIMESTAMP, Date.now().toString())
    localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summariesDict))
  } catch (e) {
    console.warn('Failed to replace posts/summaries:', e)
  }
}
