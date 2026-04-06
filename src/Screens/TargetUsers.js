import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Search as SearchIcon, Email as EmailIcon } from "@mui/icons-material";
import axios from "axios";

const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
  LOCAL: "http://127.0.0.1:8000/",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function TargetUsers() {
  const [mode, setMode] = useState("STAGING");
  const [workshopId, setWorkshopId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sendInfo, setSendInfo] = useState(null);

  const baseUrl = server[mode];

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => (b.similarity_index ?? 0) - (a.similarity_index ?? 0));
  }, [rows]);

  const fetchTargetUsers = async () => {
    const id = workshopId.trim();
    setError(null);
    setRows([]);

    if (!id) {
      setError("Enter a workshop ID (UUID).");
      return;
    }
    if (!uuidPattern.test(id)) {
      setError("Workshop ID must be a valid UUID.");
      return;
    }

    const url = `${baseUrl}n_admin/target_users_recommendations/${id}/`;
    setSendInfo(null);
    setLoading(true);
    try {
      const response = await axios.get(url);
      const raw = response.data?.target_users;
      if (!raw || typeof raw !== "object") {
        setRows([]);
        return;
      }
      const list = Object.entries(raw).map(([phone, u]) => ({
        phone,
        buyer_name: u?.buyer_name ?? "",
        buyer_email: u?.buyer_email ?? "",
        similarity_index:
          u?.similarity_index !== undefined && u?.similarity_index !== null
            ? Number(u.similarity_index)
            : null,
      }));
      setRows(list);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Request failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const sendPromoEmails = async () => {
    const id = workshopId.trim();
    setError(null);
    setSendInfo(null);

    if (!id) {
      setError("Enter a workshop ID (UUID) first.");
      return;
    }
    if (!uuidPattern.test(id)) {
      setError("Workshop ID must be a valid UUID.");
      return;
    }

    const ok = window.confirm(
      "Send the promotional HTML email to every target user for this workshop? " +
        "Each person receives a separate message (no shared To/CC list)."
    );
    if (!ok) return;

    const url = `${baseUrl}n_admin/target_users_recommendations/${id}/send/`;
    setSending(true);
    try {
      const response = await axios.post(url);
      const d = response.data || {};
      setSendInfo({
        sent: d.sent ?? 0,
        total_recipients: d.total_recipients ?? 0,
        skipped_invalid_email: d.skipped_invalid_email ?? 0,
        failed: Array.isArray(d.failed) ? d.failed : [],
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Send failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Target user recommendations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter a workshop UUID. Users are matched from recent bookings in the same city with
        overlapping dance forms (see API:{" "}
        <code>n_admin/target_users_recommendations/&lt;uuid&gt;/</code>).
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="target-users-server">Server</InputLabel>
          <Select
            labelId="target-users-server"
            label="Server"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <MenuItem value="STAGING">Staging</MenuItem>
            <MenuItem value="PRODUCTION">Production</MenuItem>
            <MenuItem value="LOCAL">Local (127.0.0.1)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Workshop ID (UUID)"
          value={workshopId}
          onChange={(e) => setWorkshopId(e.target.value)}
          fullWidth
          size="small"
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
        />
        <Button
          variant="contained"
          startIcon={loading ? null : <SearchIcon />}
          onClick={fetchTargetUsers}
          disabled={loading || sending}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} color="inherit" />
              <span>Loading…</span>
            </Stack>
          ) : (
            "Load"
          )}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={sending ? null : <EmailIcon />}
          onClick={sendPromoEmails}
          disabled={loading || sending || !workshopId.trim()}
          sx={{ minWidth: 160, whiteSpace: "nowrap" }}
        >
          {sending ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} color="inherit" />
              <span>Sending…</span>
            </Stack>
          ) : (
            "Send email promo"
          )}
        </Button>
      </Stack>

      {sendInfo && (
        <Alert
          severity={sendInfo.failed?.length ? "warning" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setSendInfo(null)}
        >
          Promo emails: sent {sendInfo.sent} of {sendInfo.total_recipients} target users.
          {sendInfo.skipped_invalid_email > 0 &&
            ` Skipped invalid email: ${sendInfo.skipped_invalid_email}.`}
          {sendInfo.failed?.length > 0 && (
            <span>
              {" "}
              Failed: {sendInfo.failed.length} (see server logs for details).
            </span>
          )}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Phone</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Similarity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {workshopId.trim() ? "No users returned." : "Enter a workshop ID and click Load."}
                </TableCell>
              </TableRow>
            )}
            {sortedRows.map((r) => (
              <TableRow key={r.phone}>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.buyer_name}</TableCell>
                <TableCell>{r.buyer_email}</TableCell>
                <TableCell align="right">
                  {r.similarity_index !== null && !Number.isNaN(r.similarity_index)
                    ? r.similarity_index.toFixed(2)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {sortedRows.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {sortedRows.length} user{sortedRows.length === 1 ? "" : "s"}
        </Typography>
      )}
    </Box>
  );
}

export default TargetUsers;
