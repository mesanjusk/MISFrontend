import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

export default function SimpleEntityCreateForm({
  title,
  label,
  value,
  placeholder,
  onChange,
  onSubmit,
  submitLabel,
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 3, md: 6 },
        background:
          'linear-gradient(135deg, rgba(220,252,231,0.6) 0%, rgba(236,253,245,0.75) 35%, rgba(240,249,255,0.95) 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={2.5} component="form" onSubmit={onSubmit}>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create and organize master data without changing existing workflows.
                </Typography>
              </Box>

              <TextField
                autoFocus
                fullWidth
                label={label}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
              />

              <Button type="submit" variant="contained" size="large" fullWidth>
                {submitLabel}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

SimpleEntityCreateForm.propTypes = {
  title: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
};

SimpleEntityCreateForm.defaultProps = {
  placeholder: '',
  submitLabel: 'Submit',
};
