import { useEffect, useState } from "react";
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
  Divider,
  Typography,
} from "@mui/material";
import { BASEURL_PROD } from "../constants";
import {
  CopyableId,
  Field,
  RazorpayOrderCheck,
  TreeNode,
  dateTime,
  money,
} from "./RazorpayOrderStatus";

const STATUS_COLOR = {
  Success: "success",
  Failed: "error",
  Pending: "warning",
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
