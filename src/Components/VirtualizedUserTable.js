import { memo } from "react";
import { List } from "react-window";
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import { WhatsApp as WhatsAppIcon } from "@mui/icons-material";

const ROW_HEIGHT = 56;
const MAX_LIST_HEIGHT = 520;

const formatIndex = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
};

const formatBreakdownTooltip = (row) => {
  const b = row.score_breakdown;
  if (!b) return `Index: ${formatIndex(row.index)}`;

  const lines = [
    `Index: ${formatIndex(row.index)}`,
    `Style: ${formatIndex(b.style)} (weight 50%)`,
    `Recency: ${formatIndex(b.recency)} (weight 30%)`,
    `Activity: ${formatIndex(b.activity)} (weight 20%)`,
  ];
  if (row.matched_styles?.length) {
    lines.push(`Matched styles: ${row.matched_styles.join(", ")}`);
  }
  if (row.matching_bookings_count) {
    lines.push(`Matching bookings: ${row.matching_bookings_count}`);
  }
  if (row.last_matching_booking) {
    lines.push(`Last match: ${row.last_matching_booking.slice(0, 10)}`);
  }
  return lines.join("\n");
};

const VirtualUserRow = memo(function VirtualUserRow({
  index: rowIndex,
  style,
  rows,
  getWhatsAppLink,
}) {
  const row = rows[rowIndex];
  if (!row) return null;

  const indexColor =
    (row.index ?? 0) >= 0.8 ? "success" : (row.index ?? 0) >= 0.5 ? "warning" : "default";

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
      <Box sx={{ flex: "0 0 8%", minWidth: 0, pr: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {rowIndex + 1}
        </Typography>
      </Box>
      <Box sx={{ flex: "0 0 12%", minWidth: 0, pr: 1 }}>
        <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{formatBreakdownTooltip(row)}</span>} arrow>
          <Chip
            size="small"
            label={formatIndex(row.index)}
            color={indexColor}
            variant="outlined"
            sx={{ fontWeight: 600, cursor: "help" }}
          />
        </Tooltip>
      </Box>
      <Box sx={{ flex: "0 0 8%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2">{formatIndex(row.score_breakdown?.style)}</Typography>
      </Box>
      <Box sx={{ flex: "0 0 8%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2">{formatIndex(row.score_breakdown?.recency)}</Typography>
      </Box>
      <Box sx={{ flex: "0 0 8%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2">{formatIndex(row.score_breakdown?.activity)}</Typography>
      </Box>
      <Box sx={{ flex: "0 0 11%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2" noWrap title={row.phone}>
          {row.phone}
        </Typography>
      </Box>
      <Box sx={{ flex: "0 0 12%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2" noWrap title={row.buyer_name}>
          {row.buyer_name}
        </Typography>
      </Box>
      <Box sx={{ flex: "1 1 18%", minWidth: 0, pr: 1 }}>
        <Typography variant="body2" noWrap title={row.buyer_email}>
          {row.buyer_email}
        </Typography>
      </Box>
      <Box sx={{ flex: "0 0 7%", textAlign: "center" }}>
        {row.booked ? (
          <Chip size="small" label="Yes" color="success" variant="outlined" />
        ) : (
          <Chip size="small" label="No" variant="outlined" />
        )}
      </Box>
      <Box sx={{ flex: "0 0 10%", textAlign: "right" }}>
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
          fontSize: "0.875rem",
        }}
      >
        <Box sx={{ flex: "0 0 8%" }}>#</Box>
        <Box sx={{ flex: "0 0 12%" }}>Index</Box>
        <Box sx={{ flex: "0 0 8%" }}>Style</Box>
        <Box sx={{ flex: "0 0 8%" }}>Recency</Box>
        <Box sx={{ flex: "0 0 8%" }}>Activity</Box>
        <Box sx={{ flex: "0 0 11%" }}>Phone</Box>
        <Box sx={{ flex: "0 0 12%" }}>Name</Box>
        <Box sx={{ flex: "1 1 18%" }}>Email</Box>
        <Box sx={{ flex: "0 0 7%", textAlign: "center" }}>Booked</Box>
        <Box sx={{ flex: "0 0 10%", textAlign: "right" }}>WhatsApp</Box>
      </Box>
      <List
        style={{ height: listHeight, width: "100%" }}
        rowCount={rows.length}
        rowHeight={ROW_HEIGHT}
        overscanCount={8}
        rowComponent={VirtualUserRow}
        rowProps={{ rows, getWhatsAppLink }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, px: 1 }}>
        Hover index for full breakdown (matched styles, count, and last matching booking)
      </Typography>
    </Box>
  );
}
