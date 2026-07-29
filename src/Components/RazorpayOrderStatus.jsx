import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { BASEURL_PROD } from "../constants";

export const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "—";

export const CopyableId = ({ value }) => {
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

export const Field = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 1, py: 0.25, flexWrap: "wrap" }}>
    <Typography variant="caption" sx={{ minWidth: 150, color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography variant="caption" component="div">
      {value ?? "—"}
    </Typography>
  </Box>
);

export const TreeNode = ({ label, badge, defaultOpen = true, children }) => {
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

/**
 * Asks Razorpay what actually happened on an order.
 *
 * Our own row cannot answer it: a capture landing after an earlier attempt
 * failed used to leave the transaction marked Failed with no payment id. The
 * endpoint behind this only issues GETs — nothing is written anywhere.
 */
export const RazorpayOrderCheck = ({ orderId, baseUrlServer, autoFetch = false }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const check = useCallback(async () => {
    if (!orderId) return;
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
  }, [orderId, baseUrlServer]);

  useEffect(() => {
    if (autoFetch) check();
  }, [autoFetch, check]);

  if (!orderId) {
    return (
      <Typography variant="caption" color="text.secondary">
        No Razorpay order id on this transaction.
      </Typography>
    );
  }

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
        {loading ? "Checking Razorpay…" : result ? "Re-check" : "Check status on Razorpay"}
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

/** Same check as a standalone popup, for tables with no room for inline results. */
export const RazorpayOrderStatusDialog = ({ open, onClose, orderId, baseUrlServer }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ textTransform: "none", pb: 0.5 }}>
      Razorpay order status
      <Typography variant="caption" component="div" sx={{ fontFamily: "monospace" }}>
        {orderId}
      </Typography>
    </DialogTitle>
    <DialogContent dividers>
      {open && (
        <RazorpayOrderCheck orderId={orderId} baseUrlServer={baseUrlServer} autoFetch />
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default RazorpayOrderCheck;
