import { useState, useRef } from 'react'
import { timeAgo } from '../utils/timeAgo'
import './PostCard.css'

const SUBREDDIT_COLORS = {
  worldnews: '#ff6b6b',
  news: '#ff6b6b',
  technology: '#4ecdc4',
  tech: '#4ecdc4',
  programming: '#a29bfe',
  code: '#a29bfe',
  personalfinance: '#00b894',
  finance: '#00b894',
  science: '#fdcb6e',
  physics: '#fdcb6e'
}

function getSubredditColor(subreddit) {
  const lower = subreddit.toLowerCase()
  for (const [key, color] of Object.entries(SUBREDDIT_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#74b9ff'
}

export function PostCard({ post, onNext, onSummarize, isRefreshing }) {
  const [isExiting, setIsExiting] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const cardRef = useRef(null)

  const handleNext = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsExiting(false)
      onNext()
    }, 300)
  }

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (!touchStart) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 100) {
      handleNext()
    }
    setTouchStart(null)
  }

  if (!post) return null

  const subredditColor = getSubredditColor(post.subreddit)

  return (
    <div
      ref={cardRef}
      className={`post-card ${isExiting ? 'post-card--exiting' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="post-card__content" onClick={onSummarize}>
        {post.thumbnail || post.preview ? (
          <div className="post-card__image-container">
            <img
              src={post.preview || post.thumbnail}
              alt=""
              className="post-card__image"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="post-card__text">
          <span
            className="post-card__subreddit"
            style={{ backgroundColor: subredditColor }}
          >
            r/{post.subreddit}
          </span>

          <h1 className="post-card__title">{post.title}</h1>

          <div className="post-card__meta">
            <span className="post-card__stat">
              <svg className="post-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m-8-8h16" />
              </svg>
              {formatNumber(post.score)}
            </span>
            <span className="post-card__stat">
              <svg className="post-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {formatNumber(post.num_comments)}
            </span>
            <span className="post-card__author">u/{post.author}</span>
            <span className="post-card__time">{timeAgo(post.created_utc)}</span>
          </div>
        </div>
      </div>

      <div className="post-card__actions">
        <button className="post-card__summarize-btn" onClick={onSummarize}>
          <svg className="post-card__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summarize
        </button>
        <button
          className="post-card__next-btn"
          onClick={handleNext}
          disabled={isRefreshing}
        >
          Next
          <svg className="post-card__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
