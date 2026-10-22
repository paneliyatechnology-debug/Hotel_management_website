"use client";

import { Box, Paper, TablePagination, Typography } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";

/**
 * Shared building blocks so every data table in the app looks identical
 * (reference: the Guest Directory table).
 *
 *   <TableCard>
 *     <TableToolbar title="..." actions={<Button/>}>   // search + filters on the left, actions on the right
 *       <TextField sx={tableFieldSx(themeConfig, 320)} />
 *     </TableToolbar>
 *     <TableContainer> <Table> ... </Table> </TableContainer>
 *     <TablePager count page rowsPerPage onPageChange onRowsPerPageChange />
 *   </TableCard>
 *
 * Header row, cell spacing, row hover and borders come from the global MUI table theme
 * (ThemeContext + globals.css), so pages do not restyle cells themselves.
 */

// Rounded white/charcoal card that wraps a table together with its toolbar and pagination
export function TableCard({ children, sx, ...rest }) {
  const { themeConfig } = useAppTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        "--table-card-pad": { xs: "16px", sm: "24px" },
        p: "var(--table-card-pad)",
        borderRadius: "20px",
        bgcolor: themeConfig.bgCard,
        border: `1.5px solid ${themeConfig.border}`,
        overflow: "hidden",
        // Table and pager run edge-to-edge: cancel the card padding on both sides
        "& .MuiTableContainer-root, & .MuiTablePagination-root": {
          marginLeft: "calc(-1 * var(--table-card-pad))",
          marginRight: "calc(-1 * var(--table-card-pad))",
          // MUI sets width:100%, so widen explicitly or only the left side bleeds out
          width: "calc(100% + 2 * var(--table-card-pad))",
          maxWidth: "none",
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}

// Standard search / filter input styling used in table toolbars
export function tableFieldSx(themeConfig, width) {
  return {
    ...(width ? { width: { xs: "100%", sm: width } } : {}),
    "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain },
  };
}

// Search box sizing: fills the row on mobile, grows up to 320px otherwise
export function tableSearchSx(themeConfig) {
  return {
    flex: { xs: "1 1 100%", sm: "1 1 240px" },
    maxWidth: { sm: 320 },
    minWidth: { sm: 150 },
    "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain },
  };
}

// Toolbar above a table: optional title, filters on the left, primary actions pushed to the right
// `filtersRight` pushes the search / filters to the right edge (title stays on the left)
export function TableToolbar({ title, children, actions, filtersRight = false, sx, ...rest }) {
  const { themeConfig } = useAppTheme();
  const filters = filtersRight ? (
    <Box
      sx={{
        ml: { sm: "auto" },
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "flex-start", sm: "flex-end" },
        // one single row from tablet width up; wraps only on small phones
        flexWrap: { xs: "wrap", sm: "nowrap" },
        gap: 1.5,
        flex: { xs: "1 1 100%", sm: "1 1 auto" },
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  ) : (
    children
  );
  return (
    <Box sx={{ display: "flex", flexWrap: filtersRight ? { xs: "wrap", sm: "nowrap" } : "wrap", alignItems: "center", gap: 1.5, mb: 2, ...sx }} {...rest}>
      {title ? (
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1, mr: { sm: 1 }, whiteSpace: "nowrap", flexShrink: 0 }}>
          {title}
        </Typography>
      ) : null}
      {filters}
      {actions ? <Box sx={{ ml: { sm: "auto" }, display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>{actions}</Box> : null}
    </Box>
  );
}

// Pagination bar with the standard look and options
export function TablePager({ sx, rowsPerPageOptions = [5, 10, 25, 50], ...props }) {
  const { themeConfig } = useAppTheme();
  return (
    <TablePagination
      component="div"
      rowsPerPageOptions={rowsPerPageOptions}
      sx={{ borderTop: `1px solid ${themeConfig.border}`, color: themeConfig.textMuted, ...sx }}
      {...props}
    />
  );
}
