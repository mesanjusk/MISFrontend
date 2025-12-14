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
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-content bg-white rounded-lg p-6 shadow-lg max-w-lg w-full">
        {title && <h4 className="text-lg font-semibold mb-4">{title}</h4>}
        {message && <p className="text-gray-700 mb-4">{message}</p>}
        {children}
        <div className="modal-actions flex justify-end gap-4 mt-6">
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
  children: PropTypes.node,
};
