import './ConfirmDialog.css';

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;

  return (
    <div className="confirm-dialog__overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Отменяем...' : 'Да, отменить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
