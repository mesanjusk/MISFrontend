import PropTypes from 'prop-types';
import Button from './Button';
import { FiX } from 'react-icons/fi';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto">
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        <div>{children}</div>
        {actions && <div className="mt-4 flex justify-end space-x-2">{actions}</div>}
        <Button
          variant="secondary"
          className="absolute top-2 right-2 px-2 py-1"
          onClick={onClose}
          aria-label="Close"
          leftIcon={FiX}
        />
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.arrayOf(PropTypes.node),
};
