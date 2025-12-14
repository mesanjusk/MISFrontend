import PropTypes from 'prop-types';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  confirmButtonClassName = 'btn btn-danger',
  cancelButtonClassName = 'btn btn-secondary',
  overlayClassName = '',
  modalClassName = '',
  actionsClassName = '',
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${overlayClassName}`} role="dialog" aria-modal="true">
      <div className={`modal-content ${modalClassName}`}>
        {title && <h4>{title}</h4>}
        {message && <div className="mb-4">{message}</div>}
        {children}
        <div className={`modal-actions ${actionsClassName}`}>
          <button onClick={onConfirm} className={confirmButtonClassName} type="button">
            {confirmText}
          </button>
          <button onClick={onCancel} className={cancelButtonClassName} type="button">
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.node,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmButtonClassName: PropTypes.string,
  cancelButtonClassName: PropTypes.string,
  overlayClassName: PropTypes.string,
  modalClassName: PropTypes.string,
  actionsClassName: PropTypes.string,
  children: PropTypes.node,
};
