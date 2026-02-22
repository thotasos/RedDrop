import { useState, useCallback } from 'react'
import { getOllamaConfig } from '../utils/storage'
import { fetchPostComments } from '../utils/api'

const SUMMARY_PROMPTS = {
  article: (title, body, comments) => `Summarize this Reddit post title, body, and top comments into 3-4 sentences:

Title: ${title}
${body ? `Body: ${body.slice(0, 2000)}` : ''}
Comments: ${comments.map(c => `${c.author}: ${c.body.slice(0, 300)}`).join('\n')}`,

  sentiment: (title, body, comments) => `What do most commenters think about this post? Summarize the prevailing opinion in 2-3 sentences:

Title: ${title}
${body ? `Body: ${body.slice(0, 2000)}` : ''}
Comments: ${comments.map(c => `${c.author}: ${c.body.slice(0, 300)}`).join('\n')}`,

  contrarian: (title, body, comments) => `Find and summarize the most dissenting or opposing opinions in these comments. Look for comments that disagree with the majority or present alternative viewpoints. Summarize in 2-3 sentences:

Title: ${title}
${body ? `Body: ${body.slice(0, 2000)}` : ''}
Comments: ${comments.map(c => `${c.author}: ${c.body.slice(0, 300)}`).join('\n')}`
}

export function useOllama() {
  const [summaries, setSummaries] = useState({
    article: { content: '', loading: false, error: null },
    sentiment: { content: '', loading: false, error: null },
    contrarian: { content: '', loading: false, error: null }
  })

  const generateSummary = useCallback(async (type, prompt) => {
    const config = getOllamaConfig()
    const { url, model } = config

    setSummaries(prev => ({
      ...prev,
      [type]: { content: '', loading: true, error: null }
    }))

    try {
      const response = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`)
      }

      const data = await response.json()

      setSummaries(prev => ({
        ...prev,
        [type]: { content: data.response || '', loading: false, error: null }
      }))

      return data.response
    } catch (error) {
      setSummaries(prev => ({
        ...prev,
        [type]: { content: '', loading: false, error: error.message }
      }))
      throw error
    }
  }, [])

  const generateAllSummaries = useCallback(async (post) => {
    // Reset summaries
    setSummaries({
      article: { content: '', loading: true, error: null },
      sentiment: { content: '', loading: true, error: null },
      contrarian: { content: '', loading: true, error: null }
    })

    // Fetch comments
    let comments = []
    try {
      comments = await fetchPostComments(post.subreddit, post.id)
    } catch (e) {
      console.error('Failed to fetch comments:', e)
    }

    // Generate all three summaries in parallel
    const prompts = {
      article: SUMMARY_PROMPTS.article(post.title, post.selftext, comments),
      sentiment: SUMMARY_PROMPTS.sentiment(post.title, post.selftext, comments),
      contrarian: SUMMARY_PROMPTS.contrarian(post.title, post.selftext, comments)
    }

    await Promise.all([
      generateSummary('article', prompts.article),
      generateSummary('sentiment', prompts.sentiment),
      generateSummary('contrarian', prompts.contrarian)
    ])
  }, [generateSummary])

  const resetSummaries = useCallback(() => {
    setSummaries({
      article: { content: '', loading: false, error: null },
      sentiment: { content: '', loading: false, error: null },
      contrarian: { content: '', loading: false, error: null }
    })
  }, [])

  return {
    summaries,
    generateSummary,
    generateAllSummaries,
    resetSummaries
  }
}
