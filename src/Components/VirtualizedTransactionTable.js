import { memo } from "react";
import { List } from "react-window";
import { Box, Button, Chip, Typography } from "@mui/material";

// Only these need a live Razorpay lookup — a Success row already carries its
// payment id, so there is nothing to resolve.
const NEEDS_RAZORPAY_CHECK = new Set(["failed", "pending"]);

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 40;
// Show ~20 rows in the viewport before the list scrolls.
const MAX_VISIBLE_ROWS = 20;

// Column definitions keep the header and virtualized rows perfectly aligned.
const COLUMNS = [
  { key: "idx", label: "#", width: 50, align: "left" },
  { key: "transaction_id", label: "Transaction ID", width: 170, align: "left" },
  { key: "payment_status", label: "Status", width: 110, align: "left" },
  { key: "user_email", label: "User Email", width: 210, align: "left" },
  { key: "user_id", label: "User ID", width: 120, align: "left" },
  { key: "subtotal", label: "Subtotal", width: 100, align: "right" },
  { key: "booking_fee", label: "Fee", width: 90, align: "right" },
  { key: "total_amount", label: "Total", width: 110, align: "right" },
  { key: "payment_method", label: "Payment Method", width: 140, align: "left" },
  { key: "razorpay_payment_id", label: "Razorpay Payment ID", width: 170, align: "left" },
  { key: "razorpay_order_id", label: "Razorpay Order ID", width: 170, align: "left" },
  { key: "created_at", label: "Created At", width: 160, align: "left" },
  { key: "error", label: "Error", width: 170, align: "left" },
  { key: "razorpay_check", label: "Razorpay", width: 120, align: "left" },
];

const TOTAL_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0);

const Cell = ({ width, align, children, mono }) => (
  <Box
    sx={{
      width,
      flex: "0 0 auto",
      px: 1,
      minWidth: 0,
      textAlign: align,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: mono ? "0.72rem" : "0.8rem",
    }}
  >
    {children}
  </Box>
);

const TransactionRow = memo(function TransactionRow({
  index,
  style,
  rows,
  formatAmount,
  formatDate,
  getStatusColor,
  onCheckRazorpay,
}) {
  const t = rows[index];
  if (!t) return null;

  const canCheck =
    NEEDS_RAZORPAY_CHECK.has(t.payment_status?.toLowerCase()) && Boolean(t.razorpay_order_id);

  return (
    <Box
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxSizing: "border-box",
        bgcolor: index % 2 ? "action.hover" : "transparent",
        "&:hover": { bgcolor: "action.selected" },
      }}
    >
      <Cell width={COLUMNS[0].width} align="left">
        <Typography variant="caption" color="text.secondary">{index + 1}</Typography>
      </Cell>
      <Cell width={COLUMNS[1].width} align="left" mono title={t.transaction_id}>
        {t.transaction_id || "N/A"}
      </Cell>
      <Cell width={COLUMNS[2].width} align="left">
        <Chip label={t.payment_status || "Unknown"} color={getStatusColor(t.payment_status)} size="small" />
      </Cell>
      <Cell width={COLUMNS[3].width} align="left" title={t.user_email}>{t.user_email || "N/A"}</Cell>
      <Cell width={COLUMNS[4].width} align="left" title={t.user_id}>{t.user_id || "N/A"}</Cell>
      <Cell width={COLUMNS[5].width} align="right">{formatAmount(t.subtotal)}</Cell>
      <Cell width={COLUMNS[6].width} align="right">{formatAmount(t.booking_fee)}</Cell>
      <Cell width={COLUMNS[7].width} align="right">
        <strong>{formatAmount(t.total_amount)}</strong>
      </Cell>
      <Cell width={COLUMNS[8].width} align="left" title={t.payment_method}>{t.payment_method || "N/A"}</Cell>
      <Cell width={COLUMNS[9].width} align="left" mono title={t.razorpay_payment_id}>
        {t.razorpay_payment_id || "N/A"}
      </Cell>
      <Cell width={COLUMNS[10].width} align="left" mono title={t.razorpay_order_id}>
        {t.razorpay_order_id || "N/A"}
      </Cell>
      <Cell width={COLUMNS[11].width} align="left">{formatDate(t.created_at)}</Cell>
      <Cell width={COLUMNS[12].width} align="left" mono title={t.error_code ? `${t.error_code}: ${t.error_reason || ""}` : ""}>
        {t.error_code ? `${t.error_code}: ${t.error_reason || ""}` : "N/A"}
      </Cell>
      <Cell width={COLUMNS[13].width} align="left">
        {canCheck ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onCheckRazorpay?.(t.razorpay_order_id)}
            sx={{ fontSize: 10, py: 0, minWidth: 0, textTransform: "none" }}
          >
            Check
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        )}
      </Cell>
    </Box>
  );
});

/**
 * Windowed transaction table. Only the visible (~20) rows are mounted, so large
 * result sets stay smooth. Horizontally scrollable to fit all columns.
 */
export default function VirtualizedTransactionTable({
  rows,
  formatAmount,
  formatDate,
  getStatusColor,
  onCheckRazorpay,
}) {
  if (!rows || rows.length === 0) return null;

  const visibleRows = Math.min(rows.length, MAX_VISIBLE_ROWS);
  const listHeight = visibleRows * ROW_HEIGHT;

  return (
    <Box
      sx={{
        mt: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflowX: "auto",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ width: TOTAL_WIDTH, minWidth: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: HEADER_HEIGHT,
            bgcolor: "action.selected",
            borderBottom: "1px solid",
            borderColor: "divider",
            fontWeight: 700,
            fontSize: "0.8rem",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          {COLUMNS.map((c) => (
            <Box key={c.key} sx={{ width: c.width, flex: "0 0 auto", px: 1, textAlign: c.align }}>
              {c.label}
            </Box>
          ))}
        </Box>

        <List
          style={{ height: listHeight, width: TOTAL_WIDTH }}
          rowCount={rows.length}
          rowHeight={ROW_HEIGHT}
          overscanCount={8}
          rowComponent={TransactionRow}
          rowProps={{ rows, formatAmount, formatDate, getStatusColor, onCheckRazorpay }}
        />
      </Box>
    </Box>
  );
}
