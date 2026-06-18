import { memo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { Box, Button, Chip, Typography } from "@mui/material";
import { WhatsApp as WhatsAppIcon } from "@mui/icons-material";

const ROW_HEIGHT = 52;
const MAX_LIST_HEIGHT = 520;

const VirtualUserRow = memo(function VirtualUserRow({
  row,
  style,
  getWhatsAppLink,
}) {
  return (
    <Box
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: 2,
        boxSizing: "border-box",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ flex: "0 0 14%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2" noWrap title={row.phone}>
          {row.phone}
        </Typography>
      </Box>
      <Box sx={{ flex: "0 0 18%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2" noWrap title={row.buyer_name}>
          {row.buyer_name}
        </Typography>
      </Box>
      <Box sx={{ flex: "1 1 28%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2" noWrap title={row.buyer_email}>
          {row.buyer_email}
        </Typography>
      </Box>
      <Box sx={{ flex: "0 0 10%", textAlign: "center" }}>
        {row.booked ? (
          <Chip size="small" label="Yes" color="success" variant="outlined" />
        ) : (
          <Chip size="small" label="No" variant="outlined" />
        )}
      </Box>
      <Box sx={{ flex: "0 0 12%", textAlign: "right" }}>
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<WhatsAppIcon />}
          href={getWhatsAppLink(row.phone, row.buyer_name)}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!getWhatsAppLink(row.phone, row.buyer_name)}
        >
          Share
        </Button>
      </Box>
    </Box>
  );
});

export default function VirtualizedUserTable({ rows, getWhatsAppLink }) {
  const listHeight = Math.min(MAX_LIST_HEIGHT, Math.max(ROW_HEIGHT, rows.length * ROW_HEIGHT));

  const RowRenderer = useCallback(
    ({ index, style }) => (
      <VirtualUserRow
        row={rows[index]}
        style={style}
        getWhatsAppLink={getWhatsAppLink}
      />
    ),
    [rows, getWhatsAppLink]
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          bgcolor: "action.selected",
          borderBottom: "1px solid",
          borderColor: "divider",
          fontWeight: 600,
        }}
      >
        <Box sx={{ flex: "0 0 14%" }}>Phone</Box>
        <Box sx={{ flex: "0 0 18%" }}>Name</Box>
        <Box sx={{ flex: "1 1 28%" }}>Email</Box>
        <Box sx={{ flex: "0 0 10%", textAlign: "center" }}>Booked</Box>
        <Box sx={{ flex: "0 0 12%", textAlign: "right" }}>WhatsApp</Box>
      </Box>
      <List
        height={listHeight}
        width="100%"
        itemCount={rows.length}
        itemSize={ROW_HEIGHT}
        overscanCount={8}
      >
        {RowRenderer}
      </List>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, px: 1 }}>
        Showing {rows.length} users (virtualized — only visible rows are rendered)
      </Typography>
    </Box>
  );
}
