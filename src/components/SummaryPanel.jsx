import { LoadingSpinner } from './LoadingSpinner'
import './SummaryPanel.css'

export function SummaryPanel({ post, isOpen, onClose, summaries }) {
  if (!isOpen || !post) return null

  return (
    <div className="summary-panel" onClick={onClose}>
      <div className="summary-panel__content" onClick={e => e.stopPropagation()}>
        <button className="summary-panel__close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="summary-panel__header">
          <span className="summary-panel__subreddit">r/{post.subreddit}</span>
          <h2 className="summary-panel__title">{post.title}</h2>
        </div>

        <div className="summary-panel__sections">
          <div className="summary-panel__section summary-panel__section--article">
            <div className="summary-panel__section-header">
              <svg className="summary-panel__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>Article Summary</h3>
            </div>
            <div className="summary-panel__section-content">
              {summaries.article.loading && <LoadingSpinner size="small" />}
              {summaries.article.error && (
                <p className="summary-panel__error">{summaries.article.error}</p>
              )}
              {summaries.article.content && (
                <p>{summaries.article.content}</p>
              )}
              {!summaries.article.loading && !summaries.article.content && !summaries.article.error && (
                <p className="summary-panel__placeholder">Preparing summary…</p>
              )}
            </div>
          </div>

          <div className="summary-panel__section summary-panel__section--sentiment">
            <div className="summary-panel__section-header">
              <svg className="summary-panel__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>Community Sentiment</h3>
            </div>
            <div className="summary-panel__section-content">
              {summaries.sentiment.loading && <LoadingSpinner size="small" />}
              {summaries.sentiment.error && (
                <p className="summary-panel__error">{summaries.sentiment.error}</p>
              )}
              {summaries.sentiment.content && (
                <p>{summaries.sentiment.content}</p>
              )}
              {!summaries.sentiment.loading && !summaries.sentiment.content && !summaries.sentiment.error && (
                <p className="summary-panel__placeholder">Preparing summary…</p>
              )}
            </div>
          </div>

          <div className="summary-panel__section summary-panel__section--contrarian">
            <div className="summary-panel__section-header">
              <svg className="summary-panel__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <h3>Contrarian View</h3>
            </div>
            <div className="summary-panel__section-content">
              {summaries.contrarian.loading && <LoadingSpinner size="small" />}
              {summaries.contrarian.error && (
                <p className="summary-panel__error">{summaries.contrarian.error}</p>
              )}
              {summaries.contrarian.content && (
                <p>{summaries.contrarian.content}</p>
              )}
              {!summaries.contrarian.loading && !summaries.contrarian.content && !summaries.contrarian.error && (
                <p className="summary-panel__placeholder">Preparing summary…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
