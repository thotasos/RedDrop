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
