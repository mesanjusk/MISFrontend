import PropTypes from 'prop-types';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

export default function Table({ columns = [], data = [] }) {
  return (
    <TableContainer component={Paper}>
      <MuiTable size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.accessor}>{col.Header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} hover>
              {columns.map((col) => (
                <TableCell key={col.accessor}>{row[col.accessor]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      Header: PropTypes.node.isRequired,
      accessor: PropTypes.string.isRequired,
    })
  ),
  data: PropTypes.arrayOf(PropTypes.object),
};
