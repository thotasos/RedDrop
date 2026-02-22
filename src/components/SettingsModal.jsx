import { useState, useEffect } from 'react'
import { getSubreddits, setSubreddits, getOllamaConfig, setOllamaConfig } from '../utils/storage'
import './SettingsModal.css'

export function SettingsModal({ isOpen, onClose, onSave }) {
  const [subreddits, setSubredditsState] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('')
  const [ollamaModel, setOllamaModel] = useState('')

  useEffect(() => {
    if (isOpen) {
      const storedSubreddits = getSubreddits()
      const config = getOllamaConfig()

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubredditsState(storedSubreddits.join('\n'))
      setOllamaUrl(config.url)
      setOllamaModel(config.model)
    }
  }, [isOpen])

  const handleSave = () => {
    const subredditList = subreddits
      .split('\n')
      .map(s => s.trim().replace(/^r\//, ''))
      .filter(s => s.length > 0)

    setSubreddits(subredditList)
    setOllamaConfig(ollamaUrl, ollamaModel)

    onSave()
    onClose()
  }

  const handleReset = () => {
    setSubredditsState(['worldnews', 'technology', 'programming', 'personalfinance', 'science'].join('\n'))
    setOllamaUrl('http://localhost:11434')
    setOllamaModel('llama3')
  }

  if (!isOpen) return null

  return (
    <div className="settings-modal" onClick={onClose}>
      <div className="settings-modal__content" onClick={e => e.stopPropagation()}>
        <div className="settings-modal__header">
          <h2>Settings</h2>
          <button className="settings-modal__close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-modal__body">
          <div className="settings-modal__section">
            <label className="settings-modal__label">Subreddits</label>
            <p className="settings-modal__hint">Enter one subreddit per line (without r/)</p>
            <textarea
              className="settings-modal__textarea"
              value={subreddits}
              onChange={e => setSubredditsState(e.target.value)}
              placeholder="worldnews&#10;technology&#10;programming"
              rows={6}
            />
          </div>

          <div className="settings-modal__section">
            <label className="settings-modal__label">Ollama Configuration</label>

            <div className="settings-modal__field">
              <span className="settings-modal__field-label">API URL</span>
              <input
                type="text"
                className="settings-modal__input"
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>

            <div className="settings-modal__field">
              <span className="settings-modal__field-label">Model</span>
              <input
                type="text"
                className="settings-modal__input"
                value={ollamaModel}
                onChange={e => setOllamaModel(e.target.value)}
                placeholder="llama3"
              />
            </div>
          </div>
        </div>

        <div className="settings-modal__actions">
          <button className="settings-modal__btn settings-modal__btn--secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className="settings-modal__btn settings-modal__btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
