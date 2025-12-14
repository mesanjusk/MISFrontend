import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

function Table({ columns = [], data = [] }) {
  const headerCells = useMemo(
    () => columns.map((col) => <TableCell key={col.accessor}>{col.Header}</TableCell>),
    [columns]
  );

  const rows = useMemo(
    () =>
      data.map((row, idx) => {
        const rowKey = row?._id || row?.id || row?.Order_id || row?.Order_uuid || idx;

        return (
          <TableRow key={rowKey} hover>
            {columns.map((col) => (
              <TableCell key={col.accessor}>{row[col.accessor]}</TableCell>
            ))}
          </TableRow>
        );
      }),
    [columns, data]
  );

  return (
    <TableContainer component={Paper}>
      <MuiTable size="small">
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </MuiTable>
    </TableContainer>
  );
}

export default React.memo(Table);

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      Header: PropTypes.node.isRequired,
      accessor: PropTypes.string.isRequired,
    })
  ),
  data: PropTypes.arrayOf(PropTypes.object),
};
