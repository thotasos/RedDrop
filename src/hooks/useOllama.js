import { useState, useCallback, useRef } from 'react'
import { getOllamaConfig, getSummary, setSummary, replacePostsAndSummaries } from '../utils/storage'
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

const EMPTY = { content: '', loading: false, error: null }
const LOADING = { content: '', loading: true, error: null }

const EMPTY_SUMMARIES = { article: EMPTY, sentiment: EMPTY, contrarian: EMPTY }
const LOADING_SUMMARIES = { article: LOADING, sentiment: LOADING, contrarian: LOADING }

async function callOllama(prompt) {
  const { url, model } = getOllamaConfig()
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  })
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`)
  const data = await response.json()
  return data.response || ''
}

export function useOllama() {
  const [summaries, setSummaries] = useState(EMPTY_SUMMARIES)
  const [isSummarizing, setIsSummarizing] = useState(false)

  // Refs for use inside async loops
  const currentPostIdRef = useRef(null)
  const isSummarizingRef = useRef(false)
  const generationIdRef = useRef(0)

  // Called when user navigates to a post — loads its summaries from localStorage
  const loadSummariesForPost = useCallback((postId) => {
    currentPostIdRef.current = postId
    const cached = getSummary(postId)
    if (cached) {
      setSummaries({
        article: { content: cached.article || '', loading: false, error: null },
        sentiment: { content: cached.sentiment || '', loading: false, error: null },
        contrarian: { content: cached.contrarian || '', loading: false, error: null }
      })
    } else {
      // Show loading spinner if background job is still running, empty otherwise
      setSummaries(isSummarizingRef.current ? LOADING_SUMMARIES : EMPTY_SUMMARIES)
    }
  }, [])

  // posts      — ordered list to process (current post first for initial path)
  // onComplete — optional callback(completedPosts) called after atomic swap
  //              provided only on the 30-min background path
  const summarizeAllPosts = useCallback(async (posts, onComplete) => {
    if (!posts.length) return

    const myId = ++generationIdRef.current
    isSummarizingRef.current = true
    setIsSummarizing(true)

    // Show loading for current post if not yet in cache
    if (currentPostIdRef.current && !getSummary(currentPostIdRef.current)) {
      setSummaries(LOADING_SUMMARIES)
    }

    const pendingSummaries = {}   // in-memory dict — becomes the atomic write at the end

    for (const post of posts) {
      if (generationIdRef.current !== myId) break

      // Already summarized in a previous session's cache — carry it forward
      const existing = getSummary(post.id)
      if (existing) {
        pendingSummaries[post.id] = existing
        if (post.id === currentPostIdRef.current) loadSummariesForPost(post.id)
        continue
      }

      try {
        let comments = []
        try { comments = await fetchPostComments(post.subreddit, post.id) } catch { /* non-fatal */ }

        if (generationIdRef.current !== myId) break

        const [article, sentiment, contrarian] = await Promise.all([
          callOllama(SUMMARY_PROMPTS.article(post.title, post.selftext, comments)),
          callOllama(SUMMARY_PROMPTS.sentiment(post.title, post.selftext, comments)),
          callOllama(SUMMARY_PROMPTS.contrarian(post.title, post.selftext, comments))
        ])

        if (generationIdRef.current !== myId) break

        const summary = { article, sentiment, contrarian }
        pendingSummaries[post.id] = summary

        // Incremental write — lets first-run users see summaries appear one by one
        setSummary(post.id, summary)

        // Live update if the user is currently viewing this post
        if (post.id === currentPostIdRef.current) {
          setSummaries({
            article:    { content: article,    loading: false, error: null },
            sentiment:  { content: sentiment,  loading: false, error: null },
            contrarian: { content: contrarian, loading: false, error: null }
          })
        }
      } catch (err) {
        console.error(`Failed to summarize post ${post.id}:`, err)
        if (post.id === currentPostIdRef.current) {
          setSummaries({
            article:    { content: '', loading: false, error: err.message },
            sentiment:  { content: '', loading: false, error: err.message },
            contrarian: { content: '', loading: false, error: err.message }
          })
        }
      }
    }

    if (generationIdRef.current === myId) {
      // Atomic write: replaces posts list + full summaries dict (removes stale entries)
      replacePostsAndSummaries(posts, pendingSummaries)

      // Refresh display in case current post was already cached above
      if (currentPostIdRef.current) loadSummariesForPost(currentPostIdRef.current)

      isSummarizingRef.current = false
      setIsSummarizing(false)

      // Background path only: swap the UI to the new batch
      if (onComplete) onComplete(posts)
    }
  }, [loadSummariesForPost])

  return {
    summaries,
    isSummarizing,
    summarizeAllPosts,
    loadSummariesForPost
  }
}
