import { useState } from 'react'
import { PostCard } from './components/PostCard'
import { SummaryPanel } from './components/SummaryPanel'
import { SettingsModal } from './components/SettingsModal'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useRedditFeed } from './hooks/useRedditFeed'
import { useOllama } from './hooks/useOllama'
import './App.css'

function App() {
  const { currentPost, loading, error, isRefreshing, getNextPost, refresh } = useRedditFeed()
  const { summaries, generateAllSummaries, resetSummaries } = useOllama()
  const [showSummary, setShowSummary] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleNextPost = () => {
    resetSummaries()
    getNextPost()
  }

  const handleSummarize = async () => {
    setShowSummary(true)
    // Only generate if not already loaded
    if (!summaries.article.content && !summaries.article.loading) {
      await generateAllSummaries(currentPost)
    }
  }

  const handleCloseSummary = () => {
    setShowSummary(false)
  }

  const handleSettingsSave = () => {
    resetSummaries()
    refresh()
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo">
          <span className="app__logo-icon">🔴</span>
          <span className="app__logo-text">RedDrop</span>
        </div>
        <button className="app__settings-btn" onClick={() => setShowSettings(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <main className="app__main">
        {loading && (
          <div className="app__loading">
            <LoadingSpinner size="large" />
            <p>Loading posts...</p>
          </div>
        )}

        {error && (
          <div className="app__error">
            <p>{error}</p>
            <button onClick={refresh}>Try Again</button>
          </div>
        )}

        {!loading && !error && currentPost && (
          <PostCard
            key={currentPost.id}
            post={currentPost}
            onNext={handleNextPost}
            onSummarize={handleSummarize}
            isRefreshing={isRefreshing}
          />
        )}

        {!loading && !error && !currentPost && (
          <div className="app__empty">
            <p>No posts available</p>
            <button onClick={refresh}>Refresh</button>
          </div>
        )}
      </main>

      <SummaryPanel
        post={currentPost}
        isOpen={showSummary}
        onClose={handleCloseSummary}
        summaries={summaries}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </div>
  )
}

export default App
