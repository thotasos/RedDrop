import { REDDIT_API_BASE, POSTS_PER_SUBREDDIT } from '../config/constants'

export async function fetchSubredditPosts(subreddit) {
  const url = `${REDDIT_API_BASE}/r/${subreddit}/top.json?limit=${POSTS_PER_SUBREDDIT}&t=day`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Subreddit r/${subreddit} not found or is private`)
        return []
      }
      if (response.status === 429) {
        console.warn(`Rate limited for r/${subreddit}`)
        return []
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return parseRedditPosts(data)
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error.message)
    return []
  }
}

export async function fetchGlobalTop() {
  const url = `${REDDIT_API_BASE}/top.json?limit=${POSTS_PER_SUBREDDIT}&t=day`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return parseRedditPosts(data)
  } catch (error) {
    console.error('Error fetching global top:', error.message)
    return []
  }
}

export async function fetchPostComments(subreddit, postId) {
  const url = `${REDDIT_API_BASE}/r/${subreddit}/comments/${postId}.json`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    // Reddit returns array: [post_data, comments_data]
    const commentsData = data[1]

    if (!commentsData || !commentsData.data) {
      return []
    }

    return parseComments(commentsData)
  } catch (error) {
    console.error('Error fetching comments:', error.message)
    return []
  }
}

function parseRedditPosts(response) {
  if (!response.data || !response.data.children) {
    return []
  }

  return response.data.children
    .map(child => child.data)
    .filter(post => !post.is_self || post.selftext) // Keep posts with content
    .map(post => ({
      id: post.id,
      subreddit: post.subreddit,
      title: post.title,
      selftext: post.selftext || '',
      author: post.author,
      score: post.score,
      num_comments: post.num_comments,
      permalink: post.permalink,
      url: post.url,
      thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
      preview: post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&'),
      created_utc: post.created_utc,
      is_video: post.is_video
    }))
}

function parseComments(commentsData) {
  if (!commentsData.children) {
    return []
  }

  return commentsData.children
    .filter(comment => comment.data.body && !comment.data.is_submitter && comment.data.body !== '[deleted]')
    .slice(0, 20) // Limit to top 20 comments
    .map(comment => ({
      id: comment.data.id,
      author: comment.data.author,
      body: comment.data.body,
      score: comment.data.score,
      created_utc: comment.data.created_utc
    }))
}
