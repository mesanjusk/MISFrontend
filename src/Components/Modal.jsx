import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      {title && (
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {title}
          <IconButton
            aria-label="Close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.arrayOf(PropTypes.node),
};
