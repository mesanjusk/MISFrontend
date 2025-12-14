import PropTypes from 'prop-types';
import { Toaster, toast } from 'react-hot-toast';

export function ToastContainer({ position = 'top-right', toastOptions }) {
  return (
    <Toaster
      position={position}
      toastOptions={{
        style: {
          background: '#F4F6F8',
          color: '#212121',
          borderRadius: '0.75rem',
        },
        success: {
          iconTheme: { primary: '#1E88E5', secondary: '#F4F6F8' },
        },
        error: {
          iconTheme: { primary: '#E53935', secondary: '#F4F6F8' },
        },
        ...toastOptions,
      }}
    />
  );
}

ToastContainer.propTypes = {
  position: PropTypes.string,
  toastOptions: PropTypes.object,
};

// eslint-disable-next-line react-refresh/only-export-components
export { toast };
