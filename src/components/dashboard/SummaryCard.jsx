import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import { Card, Stack, Typography } from '@mui/material';

const variantStyles = {
  primary: (theme) => ({ bg: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }),
  success: (theme) => ({ bg: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main }),
  warning: (theme) => ({ bg: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.main }),
  danger: (theme) => ({ bg: alpha(theme.palette.error.main, 0.12), color: theme.palette.error.main }),
};

export default function SummaryCard({ title, value, icon: Icon, variant = 'primary' }) {
  return (
    <Card sx={{ p: 2.25 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <div>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>
            {value}
          </Typography>
        </div>
        {Icon ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={(theme) => {
              const v = variantStyles[variant] || variantStyles.primary;
              const { bg, color } = v(theme);
              return { bgcolor: bg, color, width: 44, height: 44, borderRadius: '50%' };
            }}
          >
            <Icon fontSize="small" />
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
};
