# Pre-Loading Summaries Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate on-demand summarization by pre-generating all summaries in the background, using an atomic swap so the 30-min refresh never disrupts the current session.

**Architecture:** Two fetch modes — startup fetches posts and shows them immediately while summarizing incrementally; the 30-min timer fetches new posts into a `pendingPosts` staging state, summarizes them fully in the background, then atomically replaces both posts and summaries in localStorage and swaps the UI only when the entire new batch is ready.

**Tech Stack:** React 18, Vite, localStorage, Ollama REST API, Reddit JSON API

---

## Context

No test framework is configured. Each task includes a **Verify** step using the browser console / localStorage to confirm correctness before committing. Do not skip verify steps.

---

### Task 1: Reduce Post Count

**Goal:** Drop from 50 to 5 posts per subreddit so a full summarization batch completes in ~25–35 minutes (aligned with the 30-min refresh interval).

**Files:**
- Modify: `src/config/constants.js:12`

**Step 1: Edit the constant**

```js
// src/config/constants.js
export const POSTS_PER_SUBREDDIT = 5   // was 50
```

**Step 2: Verify in browser**

Start dev server (`npm run dev`), open DevTools → Network tab. Confirm each Reddit subreddit call has `limit=5` in the URL (e.g. `...top.json?limit=5&t=day`).

**Step 3: Commit**

```bash
git add src/config/constants.js
git commit -m "config: reduce posts per subreddit from 50 to 5 for practical batch times"
```

---

### Task 2: Add `replacePostsAndSummaries` to Storage

**Goal:** One atomic write that replaces posts list + full summaries object simultaneously, removing stale summaries from previous batches.

**Files:**
- Modify: `src/utils/storage.js`

**Step 1: Add the function**

Add at the bottom of `src/utils/storage.js`:

```js
export function replacePostsAndSummaries(posts, summariesDict) {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
    localStorage.setItem(STORAGE_KEYS.POSTS_TIMESTAMP, Date.now().toString())
    localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summariesDict))
  } catch (e) {
    console.warn('Failed to replace posts/summaries:', e)
  }
}
```

**Step 2: Verify**

In browser console:
```js
import('/src/utils/storage.js').then(m => {
  m.replacePostsAndSummaries([{id:'test'}], {test:{article:'a',sentiment:'b',contrarian:'c'}})
  console.log(JSON.parse(localStorage.getItem('reddrop_posts')))       // [{id:'test'}]
  console.log(JSON.parse(localStorage.getItem('reddrop_summaries')))   // {test:{...}}
})
```

**Step 3: Commit**

```bash
git add src/utils/storage.js
git commit -m "storage: add replacePostsAndSummaries for atomic batch writes"
```

---

### Task 3: Refactor `useRedditFeed` — Two Fetch Modes

**Goal:** Add `fetchBackground()` for the 30-min timer (doesn't touch the active UI state), `pendingPosts` state to hold the incoming batch, and `activateNewBatch(posts)` to swap the UI after all summaries are ready.

**Files:**
- Modify: `src/hooks/useRedditFeed.js`

**Step 1: Rewrite the hook**

Replace the entire file content:

```js
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSubredditPosts, fetchGlobalTop } from '../utils/api'
import { getSubreddits, setCachedPosts, getCachedPosts, clearPostsAndSummaries } from '../utils/storage'
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

  // Shared fetch logic — returns deduplicated shuffled posts or throws
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
```

**Step 2: Verify — startup path**

Run `npm run dev`. Open DevTools → Console. After articles load, check:
```js
localStorage.getItem('reddrop_posts')        // should have posts
localStorage.getItem('reddrop_summaries')    // should be '{}' or null (not yet summarized)
```
Also confirm the app shows a post card immediately (loading spinner resolves).

**Step 3: Verify — pendingPosts stays empty on startup**

In React DevTools, inspect `useRedditFeed`'s state. `pendingPosts` should be `[]` after startup (the `setPendingPosts([])` call in `fetchFeed`).

**Step 4: Commit**

```bash
git add src/hooks/useRedditFeed.js
git commit -m "feat: add fetchBackground and activateNewBatch for atomic 30-min swap"
```

---

### Task 4: Update `useOllama` — In-Memory Dict + Atomic Write + `onComplete` Callback

**Goal:** `summarizeAllPosts` now builds a complete in-memory summaries dict while also saving incrementally to localStorage (for first-run UX). When the full loop finishes, it atomically replaces posts + summaries in localStorage and calls the optional `onComplete(completedPosts)` callback.

**Files:**
- Modify: `src/hooks/useOllama.js`

**Step 1: Update imports**

```js
import { useState, useCallback, useRef } from 'react'
import { getOllamaConfig, getSummary, setSummary, replacePostsAndSummaries } from '../utils/storage'
import { fetchPostComments } from '../utils/api'
```

**Step 2: Update `summarizeAllPosts` signature and body**

Replace the existing `summarizeAllPosts` function with:

```js
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
```

**Step 3: Verify incremental writes**

Run `npm run dev`. Open DevTools → Application → localStorage. Watch `reddrop_summaries` key — it should grow one entry at a time as Ollama processes each post.

**Step 4: Verify atomic replace**

After the first summarization run completes, check:
```js
const s = JSON.parse(localStorage.getItem('reddrop_summaries'))
Object.keys(s).length  // should equal the number of posts fetched (~25)
```
Old post IDs from a previous session should not appear.

**Step 5: Commit**

```bash
git add src/hooks/useOllama.js
git commit -m "feat: summarizeAllPosts builds in-memory dict and does atomic swap on completion"
```

---

### Task 5: Update `App.jsx` — Route Initial vs Background Paths

**Goal:** A single `useEffect` on `lastFetchTime` decides which path to take based on whether `pendingPosts` is populated. The background path passes `activateNewBatch` as the `onComplete` callback; the initial path does not.

**Files:**
- Modify: `src/App.jsx`

**Step 1: Update the destructured hook values**

```js
const {
  posts, pendingPosts, currentPost,
  loading, error, isRefreshing, lastFetchTime,
  activateNewBatch, getNextPost, refresh
} = useRedditFeed()
const { summaries, isSummarizing, summarizeAllPosts, loadSummariesForPost } = useOllama()
```

**Step 2: Replace the summarization `useEffect`**

Remove the existing `useEffect([lastFetchTime])` that called `summarizeAllPosts(prioritized)` and replace it with:

```js
// Route to the correct summarization path whenever a fetch completes
useEffect(() => {
  if (lastFetchTime === 0) return

  if (pendingPosts.length > 0) {
    // 30-min background refresh: summarize pending batch, then atomically swap UI
    summarizeAllPosts(pendingPosts, activateNewBatch)
  } else if (posts.length > 0 && currentPost) {
    // Initial startup fetch: show posts immediately, summarize with current post first
    const prioritized = [currentPost, ...posts.filter(p => p.id !== currentPost.id)]
    summarizeAllPosts(prioritized)
  }
}, [lastFetchTime]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 3: Remove `resetSummaries` from `handleNextPost`** (no longer needed — navigation just loads from localStorage)

```js
const handleNextPost = () => {
  getNextPost()
}
```

**Step 4: Keep `handleSettingsSave` calling `refresh()`** (this calls `fetchFeed` which goes through the initial path — correct)

**Step 5: Verify build**

```bash
npm run build
```

Expected: zero errors.

**Step 6: Smoke test — initial path**

1. Clear localStorage (DevTools → Application → Clear site data)
2. `npm run dev`, open browser
3. Confirm posts appear immediately (no long wait)
4. Open DevTools → Network: verify Ollama calls start automatically
5. Open SummaryPanel on the first post — should show content within ~90 s (current post is prioritized)

**Step 7: Smoke test — background refresh path**

Temporarily change `REFRESH_INTERVAL` in `constants.js` to `30 * 1000` (30 seconds) for testing:

1. Let app load and start summarizing
2. After 30 s, watch Network tab — a new batch of Reddit fetches should start
3. Confirm `pendingPosts` in React DevTools is populated (5 posts per sub)
4. Confirm the active `posts`/`currentPost` in UI does NOT change until all new summaries are done
5. After all new Ollama calls complete, confirm UI refreshes with new posts
6. Restore `REFRESH_INTERVAL = 30 * 60 * 1000`

**Step 8: Commit**

```bash
git add src/App.jsx src/config/constants.js
git commit -m "feat: route summarization via pendingPosts for atomic 30-min swap"
```

---

### Task 6: Final Verification & Cleanup

**Step 1: Full build**

```bash
npm run build
```

Expected: clean build, no warnings about unused imports.

**Step 2: Check localStorage isolation**

After a full summarization run:
```js
// In browser console:
const posts = JSON.parse(localStorage.getItem('reddrop_posts'))
const summaries = JSON.parse(localStorage.getItem('reddrop_summaries'))
const summaryIds = new Set(Object.keys(summaries))
const allMatch = posts.every(p => summaryIds.has(p.id))
console.log('All posts have summaries:', allMatch)   // should be true after batch completes
```

**Step 3: Verify no on-demand Ollama calls**

1. Let full batch complete (all posts summarized)
2. Navigate to several different posts using Next button
3. Open SummaryPanel on each — no new Ollama calls should appear in Network tab

**Step 4: Commit (if any cleanup changes)**

```bash
git add -A
git commit -m "chore: final cleanup for pre-loading summaries feature"
```

---

## Implementation Order

1. Task 1 — constants (2 min)
2. Task 2 — storage (5 min)
3. Task 3 — useRedditFeed (15 min)
4. Task 4 — useOllama (15 min)
5. Task 5 — App.jsx (10 min)
6. Task 6 — verify (10 min)
