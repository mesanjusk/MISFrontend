import { Toaster, toast } from 'react-hot-toast';

export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
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
    }}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { toast };
