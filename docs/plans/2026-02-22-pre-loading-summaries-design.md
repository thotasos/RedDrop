# Pre-Loading Summaries Design

**Date:** 2026-02-22
**Status:** Approved

## Problem

Summaries are generated on-demand (when a user opens a post's SummaryPanel while the background job is still processing it). The 30-minute refresh cycle wipes localStorage before new data is ready, breaking summaries for the duration of the rebuild. Users experience loading spinners instead of instant summaries.

## Goal

1. On app start: show posts immediately, summarize all in background, summaries become available as each one completes.
2. On 30-min refresh: build new batch entirely in background without disturbing current session. Swap old data for new atomically only after ALL new summaries are ready.

## Post Count

`POSTS_PER_SUBREDDIT` reduced from 50 → 5.
5 subreddits + global top ≈ 25–30 posts after deduplication.
~60–90 s per post × 25 posts ≈ 25–35 min per batch — aligned with the 30-min refresh interval.

## Architecture

### Two Fetch Modes (`useRedditFeed`)

**`fetchFeed()`** — startup and settings change:
- Wipes display state, fetches posts, immediately updates `posts`/`currentPost`/`loading`
- Triggers summarization pipeline with no swap callback (incremental mode)

**`fetchBackground()`** — 30-min timer:
- Fetches new posts silently into `pendingPosts` state
- Does NOT touch active `posts`/`currentPost`
- Triggers summarization pipeline with `activateNewBatch` as the swap callback

New exports from `useRedditFeed`: `pendingPosts`, `activateNewBatch(posts)`

### Summarization Pipeline (`useOllama`)

`summarizeAllPosts(posts, onComplete?)`:

1. Saves each summary **incrementally** to localStorage as generated (first-run users see summaries appear one by one)
2. Builds an **in-memory dict** `{ postId → { article, sentiment, contrarian } }`
3. On loop completion: calls `replacePostsAndSummaries(posts, dict)` — atomic write replacing both posts list and full summaries object (removes stale summaries from previous batches)
4. If `onComplete(completedPosts)` provided (30-min path): calls it, triggering `activateNewBatch`

**Key guarantee:** User browses old posts with complete summaries throughout the 30-min refresh. UI switches to new posts only after `activateNewBatch` — which fires only after ALL new summaries are saved.

### Storage (`storage.js`)

New function: `replacePostsAndSummaries(posts, summariesDict)`
Atomically writes `POSTS`, `POSTS_TIMESTAMP`, and `SUMMARIES` keys in one operation.

### App.jsx Coordination

Single `useEffect` watching `lastFetchTime`:

```js
useEffect(() => {
  if (pendingPosts.length > 0) {
    // 30-min background refresh: atomic swap when done
    summarizeAllPosts(pendingPosts, activateNewBatch)
  } else if (posts.length > 0 && currentPost) {
    // Initial fetch: incremental, prioritize current post
    const prioritized = [currentPost, ...posts.filter(p => p.id !== currentPost.id)]
    summarizeAllPosts(prioritized)
  }
}, [lastFetchTime])
```

## Files to Change

| File | Change |
|------|--------|
| `src/config/constants.js` | `POSTS_PER_SUBREDDIT` 50 → 5 |
| `src/utils/storage.js` | Add `replacePostsAndSummaries(posts, dict)` |
| `src/hooks/useRedditFeed.js` | Add `fetchBackground()`, `pendingPosts` state, `activateNewBatch()` |
| `src/hooks/useOllama.js` | `summarizeAllPosts(posts, onComplete?)` — build in-memory dict, atomic write at end, call `onComplete` |
| `src/App.jsx` | Update `useEffect([lastFetchTime])` to route initial vs background paths |
