import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSubredditPosts, fetchGlobalTop } from '../utils/api'
import { getSubreddits, setCachedPosts, clearPostsAndSummaries } from '../utils/storage'
import { REFRESH_INTERVAL } from '../config/constants'

export function useRedditFeed() {
  const [posts, setPosts] = useState([])
  const [pendingPosts, setPendingPosts] = useState([])
  const [currentPost, setCurrentPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const usedPostIds = useRef(new Set())

  // Shared fetch logic — returns deduplicated shuffled posts
  const fetchFromReddit = useCallback(async () => {
    const subreddits = getSubreddits()
    const results = await Promise.all([
      ...subreddits.map(s => fetchSubredditPosts(s)),
      fetchGlobalTop()
    ])
    const seen = new Set()
    const unique = []
    results.flat().forEach(post => {
      if (!seen.has(post.id)) { seen.add(post.id); unique.push(post) }
    })
    return shuffleArray(unique)
  }, [])

  // Apply a post list to the active UI (posts + currentPost)
  const applyPosts = useCallback((postList) => {
    usedPostIds.current = new Set()
    setPosts(postList)
    if (postList.length > 0) {
      const post = postList[Math.floor(Math.random() * postList.length)]
      usedPostIds.current.add(post.id)
      setCurrentPost(post)
    } else {
      setError('No posts available. Try adding more subreddits.')
    }
  }, [])

  // STARTUP / SETTINGS CHANGE: fetch, show UI immediately, trigger summarization
  const fetchFeed = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    clearPostsAndSummaries()

    try {
      const postList = await fetchFromReddit()
      setCachedPosts(postList)
      applyPosts(postList)
      setPendingPosts([])         // no pending — initial path
      setLastFetchTime(Date.now())
    } catch (err) {
      setError(err.message || 'Failed to fetch posts')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [fetchFromReddit, applyPosts])

  // 30-MIN TIMER: fetch silently into pendingPosts, don't disturb active UI
  const fetchBackground = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const postList = await fetchFromReddit()
      setPendingPosts(postList)   // signals background path
      setLastFetchTime(Date.now())
    } catch (err) {
      console.error('Background refresh failed:', err)
      setIsRefreshing(false)
    }
  }, [fetchFromReddit])

  // Called by App.jsx after the background summarization batch completes
  const activateNewBatch = useCallback((newPosts) => {
    setCachedPosts(newPosts)
    applyPosts(newPosts)
    setPendingPosts([])
    setLoading(false)
    setIsRefreshing(false)
  }, [applyPosts])

  const getNextPost = useCallback(() => {
    if (posts.length === 0) return
    const unused = posts.filter(p => !usedPostIds.current.has(p.id))
    if (unused.length === 0) {
      usedPostIds.current = new Set()
      const shuffled = shuffleArray([...posts])
      setPosts(shuffled)
      const post = shuffled[Math.floor(Math.random() * shuffled.length)]
      usedPostIds.current.add(post.id)
      setCurrentPost(post)
      return
    }
    const post = unused[Math.floor(Math.random() * unused.length)]
    usedPostIds.current.add(post.id)
    setCurrentPost(post)
  }, [posts])

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    fetchFeed(false)
  }, [fetchFeed])

  // Initial fetch on mount
  useEffect(() => {
    fetchFeed()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 30-min background refresh — uses fetchBackground, not fetchFeed
  useEffect(() => {
    const interval = setInterval(fetchBackground, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchBackground])

  return {
    posts,
    pendingPosts,
    currentPost,
    loading,
    error,
    isRefreshing,
    lastFetchTime,
    activateNewBatch,
    getNextPost,
    refresh
  }
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
