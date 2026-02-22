import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSubredditPosts, fetchGlobalTop } from '../utils/api'
import { getSubreddits } from '../utils/storage'
import { REFRESH_INTERVAL } from '../config/constants'

export function useRedditFeed() {
  const [posts, setPosts] = useState([])
  const [currentPost, setCurrentPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const usedPostIds = useRef(new Set())

  const fetchFeed = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const subreddits = getSubreddits()
      const allPosts = []

      // Fetch from each subreddit in parallel
      const subredditPromises = subreddits.map(async (subreddit) => {
        const posts = await fetchSubredditPosts(subreddit)
        return posts
      })

      // Also fetch global top
      const globalPromise = fetchGlobalTop()

      const results = await Promise.all([...subredditPromises, globalPromise])

      results.forEach(posts => {
        allPosts.push(...posts)
      })

      // Deduplicate by post ID
      const uniquePosts = []
      const seenIds = new Set()

      for (const post of allPosts) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id)
          uniquePosts.push(post)
        }
      }

      // Shuffle the posts
      const shuffled = shuffleArray(uniquePosts)

      setPosts(shuffled)
      usedPostIds.current = new Set()

      // Pick a random post
      if (shuffled.length > 0) {
        const randomIndex = Math.floor(Math.random() * shuffled.length)
        const post = shuffled[randomIndex]
        usedPostIds.current.add(post.id)
        setCurrentPost(post)
      } else {
        setError('No posts available. Try adding more subreddits.')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch posts')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const getNextPost = useCallback(() => {
    if (posts.length === 0) return

    // Find unused posts
    const unusedPosts = posts.filter(p => !usedPostIds.current.has(p.id))

    // If all posts used, reshuffle
    if (unusedPosts.length === 0) {
      usedPostIds.current = new Set()
      const shuffled = shuffleArray([...posts])
      setPosts(shuffled)
      const randomIndex = Math.floor(Math.random() * shuffled.length)
      const post = shuffled[randomIndex]
      usedPostIds.current.add(post.id)
      setCurrentPost(post)
      return
    }

    // Pick random from unused
    const randomIndex = Math.floor(Math.random() * unusedPosts.length)
    const post = unusedPosts[randomIndex]
    usedPostIds.current.add(post.id)
    setCurrentPost(post)
  }, [posts])

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    fetchFeed(false)
  }, [fetchFeed])

  // Initial fetch
  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  // Background refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeed(false)
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchFeed])

  return {
    posts,
    currentPost,
    loading,
    error,
    isRefreshing,
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
