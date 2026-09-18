type AlertType = 'success' | 'error' | 'info'

interface AlertProps {
  type: AlertType
  message: string
  onClose?: () => void
  inline?: boolean
}

function Alert({ type, message, onClose, inline = false }: AlertProps) {
  return (
    <div className={`alert alert-${type} ${inline ? 'alert-inline' : ''}`}>
      <div className="alert-content">
        <span className="alert-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '!'}
          {type === 'info' && 'i'}
        </span>

        <p>{message}</p>
      </div>

      {onClose && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default Alert