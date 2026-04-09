import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Paper, Stack } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function FullscreenAddFormLayout({
  children,
  onSubmit,
  onClose,
  submitLabel = 'Submit',
  cancelLabel = 'Close',
  disableSubmit = false,
  busy = false,
  submitType = 'submit',
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1250,
        bgcolor: 'background.default',
        overflowY: 'auto',
        overflowX: 'hidden',
        p: { xs: 1, sm: 1.5 },
      }}
    >
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          width: '100%',
          minHeight: '100%',
          pb: 10,
        }}
      >
        <Stack spacing={1}>
          {children}
        </Stack>

        <Paper
          elevation={6}
          sx={{
            position: 'sticky',
            bottom: 8,
            mt: 1,
            p: 1,
            borderRadius: 2.5,
            zIndex: 1260,
          }}
        >
          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              startIcon={<CloseRoundedIcon />}
              onClick={onClose}
              sx={{ borderRadius: 2, py: 1 }}
            >
              {cancelLabel}
            </Button>

            <Button
              type={submitType}
              variant="contained"
              fullWidth
              disabled={disableSubmit || busy}
              sx={{ borderRadius: 2, py: 1 }}
            >
              {submitLabel}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

FullscreenAddFormLayout.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  disableSubmit: PropTypes.bool,
  busy: PropTypes.bool,
  submitType: PropTypes.string,
};
