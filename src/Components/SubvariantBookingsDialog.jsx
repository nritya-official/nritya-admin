import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { BASEURL_PROD } from "../constants";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "—";

const STATUS_COLOR = {
  Success: "success",
  Failed: "error",
  Pending: "warning",
};

const CopyableId = ({ value }) => {
  if (!value) return <span>—</span>;
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Box component="span" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
        {value}
      </Box>
      <Tooltip title="Copy">
        <IconButton
          size="small"
          sx={{ p: 0.25 }}
          onClick={() => navigator.clipboard?.writeText(value)}
        >
          <CopyIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const Field = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 1, py: 0.25, flexWrap: "wrap" }}>
    <Typography variant="caption" sx={{ minWidth: 150, color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography variant="caption" component="div">
      {value ?? "—"}
    </Typography>
  </Box>
);

const TreeNode = ({ label, badge, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box sx={{ mt: 0.5 }}>
      <Box
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {open ? (
          <ExpandMoreIcon sx={{ fontSize: 16 }} />
        ) : (
          <ChevronRightIcon sx={{ fontSize: 16 }} />
        )}
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {badge}
      </Box>
      {open && (
        <Box sx={{ ml: 2, pl: 1.5, borderLeft: "1px dashed", borderColor: "divider" }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

const VERDICT_SEVERITY = {
  MONEY_RECEIVED: "success",
  PARTIALLY_REFUNDED: "warning",
  REFUNDED_IN_FULL: "info",
  AUTHORIZED_NOT_CAPTURED: "error",
  ALL_ATTEMPTS_FAILED: "info",
  NO_PAYMENT_ATTEMPTS: "warning",
};

const ATTEMPT_COLOR = {
  captured: "success",
  authorized: "warning",
  refunded: "info",
  failed: "error",
};

// Asks Razorpay what actually happened on the order. Our own row cannot answer
// it: a capture landing after an earlier attempt failed used to leave the
// transaction marked Failed with no payment id.
const RazorpayOrderCheck = ({ orderId, baseUrlServer }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!orderId) return null;

  const check = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const baseUrl = baseUrlServer || BASEURL_PROD;
      const response = await fetch(
        `${baseUrl}payments/razorpay_order_status/${orderId}`
      );
      const payload = await response.json();
      if (payload.success) {
        setResult(payload.data);
      } else {
        setError(payload.message || "Razorpay lookup failed");
      }
    } catch (err) {
      setError(`Razorpay lookup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="outlined"
        onClick={check}
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />
        }
        sx={{ fontSize: 11, textTransform: "none" }}
      >
        {loading ? "Checking Razorpay…" : "Check status on Razorpay"}
      </Button>
      <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
        read-only — writes nothing
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 1 }}>
          <Alert severity={VERDICT_SEVERITY[result.verdict] || "warning"}>
            <strong>{result.verdict.replace(/_/g, " ")}</strong> — {result.suggested_action}
          </Alert>
          <Box sx={{ mt: 0.5 }}>
            <Field label="order_status" value={result.order_status} />
            <Field
              label="amount / amount_paid"
              value={`${money(result.order_amount)} / ${money(result.order_amount_paid)}`}
            />
            {result.decisive_payment_id && (
              <Field
                label="captured payment_id"
                value={<CopyableId value={result.decisive_payment_id} />}
              />
            )}
            <TreeNode
              label={`Attempts on Razorpay (${result.attempts.length})`}
              defaultOpen={result.attempts.length <= 4}
            >
              {result.attempts.map((attempt) => (
                <Box key={attempt.payment_id} sx={{ py: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Chip
                      size="small"
                      sx={{ height: 18, fontSize: 11 }}
                      color={ATTEMPT_COLOR[attempt.status] || "default"}
                      label={attempt.status}
                    />
                    <Typography variant="caption">
                      {money(attempt.amount)}
                      {attempt.method ? ` · ${attempt.method}` : ""}
                      {attempt.created_at ? ` · ${dateTime(attempt.created_at)}` : ""}
                    </Typography>
                  </Box>
                  <Field label="payment_id" value={<CopyableId value={attempt.payment_id} />} />
                  {attempt.amount_refunded > 0 && (
                    <Field label="amount_refunded" value={money(attempt.amount_refunded)} />
                  )}
                  {attempt.error_description && (
                    <Field label="error" value={attempt.error_description} />
                  )}
                </Box>
              ))}
            </TreeNode>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const SubvariantBookingsDialog = ({ open, onClose, subvariantId, baseUrlServer }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !subvariantId) return;

    let cancelled = false;
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const baseUrl = baseUrlServer || BASEURL_PROD;
        const response = await fetch(
          `${baseUrl}payments/subvariant_bookings/${subvariantId}`
        );
        const payload = await response.json();
        if (cancelled) return;
        if (payload.success) {
          setData(payload.data);
        } else {
          setError(payload.message || "Failed to fetch booking details");
        }
      } catch (err) {
        if (!cancelled) setError(`Error fetching booking details: ${err.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [open, subvariantId, baseUrlServer]);

  const counterDrift = data ? data.current_bookings - data.seats_from_items : 0;
  const unpaidSeats = data ? data.seats_from_items - data.seats_on_success : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textTransform: "none" }}>
        Sold breakdown
        {data?.subvariant_description ? ` — ${data.subvariant_description}` : ""}
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {data && (
          <>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              <Chip size="small" label={`Sold (counter): ${data.current_bookings}`} />
              <Chip size="small" label={`Seats in booking items: ${data.seats_from_items}`} />
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`Seats on Success: ${data.seats_on_success}`}
              />
              <Chip size="small" label={`Capacity: ${data.capacity}`} />
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip
                size="small"
                variant="outlined"
                label={`Revenue shown: ${money(data.revenue_from_counter)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Revenue from items: ${money(data.revenue_from_items)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                color="success"
                label={`Revenue on Success: ${money(data.revenue_on_success)}`}
              />
            </Box>

            {counterDrift !== 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                The counter is {counterDrift > 0 ? "ahead of" : "behind"} the booking
                items by {Math.abs(counterDrift)} seat(s). {counterDrift > 0
                  ? "Seats are held with no booking row to account for them."
                  : "There are more booked seats than the counter admits."}
              </Alert>
            )}

            {unpaidSeats > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {unpaidSeats} seat(s) sit on a transaction that is not Success. Check the
                Razorpay order before treating these as unpaid — a capture that landed
                after an earlier attempt failed used to leave the transaction marked
                Failed.
              </Alert>
            )}

            {data.items.length === 0 && (
              <Alert severity="info">No booking items reference this subvariant.</Alert>
            )}

            {data.items.map((item, index) => {
              const transaction = item.transaction;
              const isPaid = transaction?.payment_status === "Success";
              return (
                <Box key={item.booking_item_id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <TreeNode
                    defaultOpen={!isPaid}
                    label={`Booking Item · qty ${item.quantity} · ${money(item.subtotal)}`}
                    badge={
                      <Chip
                        size="small"
                        sx={{ height: 18, fontSize: 11 }}
                        color={STATUS_COLOR[transaction?.payment_status] || "default"}
                        label={transaction?.payment_status || "no transaction"}
                      />
                    }
                  >
                    <Field label="booking_item_id" value={<CopyableId value={item.booking_item_id} />} />
                    <Field label="quantity" value={item.quantity} />
                    <Field label="price_per_ticket" value={money(item.price_per_ticket)} />
                    <Field label="subtotal" value={money(item.subtotal)} />
                    {item.discount_amount > 0 && (
                      <Field label="discount_amount" value={money(item.discount_amount)} />
                    )}
                    <Field label="date / time" value={`${item.date || "—"} ${item.time || ""}`} />

                    <TreeNode label="Booking">
                      <Field label="booking_id" value={<CopyableId value={item.booking?.booking_id} />} />
                      <Field label="buyer_name" value={item.booking?.buyer_name} />
                      <Field label="buyer_email" value={item.booking?.buyer_email} />
                      <Field label="buyer_phone" value={item.booking?.buyer_phone} />
                      <Field label="transaction_id" value={<CopyableId value={item.booking?.transaction_id} />} />
                    </TreeNode>

                    <TreeNode label="Transaction">
                      {transaction ? (
                        <>
                          <Field label="transaction_id" value={<CopyableId value={transaction.transaction_id} />} />
                          <Field
                            label="payment_status"
                            value={
                              <Chip
                                size="small"
                                sx={{ height: 18, fontSize: 11 }}
                                color={STATUS_COLOR[transaction.payment_status] || "default"}
                                label={transaction.payment_status}
                              />
                            }
                          />
                          <Field label="total_amount" value={money(transaction.total_amount)} />
                          <Field label="payment_method" value={transaction.payment_method} />
                          <Field
                            label="initiated at"
                            value={dateTime(transaction.payment_initiation_time)}
                          />
                          <Field
                            label="completed at"
                            value={dateTime(transaction.payment_completion_time)}
                          />
                          <Field label="razorpay_order_id" value={<CopyableId value={transaction.razorpay_order_id} />} />
                          <Field label="razorpay_payment_id" value={<CopyableId value={transaction.razorpay_payment_id} />} />
                          {transaction.error_reason && (
                            <Field label="error_reason" value={transaction.error_reason} />
                          )}
                          {!isPaid && (
                            <RazorpayOrderCheck
                              orderId={transaction.razorpay_order_id}
                              baseUrlServer={baseUrlServer}
                            />
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" color="error">
                          No transaction linked to this booking.
                        </Typography>
                      )}
                    </TreeNode>
                  </TreeNode>
                </Box>
              );
            })}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubvariantBookingsDialog;
