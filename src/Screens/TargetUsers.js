import { useState, useMemo, useEffect, useRef } from "react";
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
  Chip,
  Autocomplete,
  Divider,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import axios from "axios";
import citiesData from "../cities.json";

const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
  LOCAL: "http://127.0.0.1:8000/",
};

const render = {
  PRODUCTION: "https://www.nritya.co.in",
  STAGING: "https://nritya-webapp-ssr-1-b3a1c0b4b8f2.herokuapp.com",
  LOCAL: "http://localhost:3000",
};

const getOrdinal = (day) => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatWorkshopDate = (dateString) => {
  if (!dateString) return "Date TBA";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${getOrdinal(day)} ${month}, ${year}`;
};

const formatWorkshopTime = (timeString) => {
  if (!timeString) return "Time TBA";
  const [start] = String(timeString).split("-");
  if (!start) return "Time TBA";
  const [h, m] = start.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return "Time TBA";
  const isPM = h >= 12;
  const hr12 = h % 12 || 12;
  const min = String(m).padStart(2, "0");
  return `${hr12}:${min} ${isPM ? "PM" : "AM"} onwards`;
};

const toAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatInr = (value) => {
  const n = toAmount(value);
  if (n === null) return "TBA";
  return `Rs ${n.toFixed(0)}`;
};

function TargetUsers() {
  const hasLoadedInitialWorkshops = useRef(false);
  const [mode, setMode] = useState("PRODUCTION");
  const [city, setCity] = useState("Gurugram");
  const [workshopFilter, setWorkshopFilter] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopId, setWorkshopId] = useState("");
  const [rows, setRows] = useState([]);
  const [priceSummary, setPriceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sendInfo, setSendInfo] = useState(null);

  const baseUrl = server[mode];

  const filteredWorkshops = useMemo(() => {
    const q = workshopFilter.trim().toLowerCase();
    if (!q) return workshops;
    return workshops.filter((w) => {
      const name = (w.name || "").toLowerCase();
      const id = (w.workshop_id || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [workshops, workshopFilter]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (b.similarity_index ?? 0) - (a.similarity_index ?? 0)),
    [rows]
  );
  const bookedCount = useMemo(
    () => sortedRows.filter((r) => Boolean(r.booked)).length,
    [sortedRows]
  );

  const fetchUpcomingWorkshops = async (chosenCity = city) => {
    const cityName = (chosenCity || "").trim();
    setError(null);
    setWorkshops([]);
    setWorkshopFilter("");
    setSelectedWorkshop(null);
    setWorkshopId("");
    setRows([]);
    setPriceSummary(null);
    setSendInfo(null);

    if (!cityName) {
      setError("Select or enter a city.");
      return;
    }

    const url = `${baseUrl}crud/get_upcoming_workshops_by_city/${encodeURIComponent(cityName)}`;
    setWorkshopsLoading(true);
    try {
      const response = await axios.get(url);
      setWorkshops(response.data?.workshops || []);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch upcoming workshops";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setWorkshopsLoading(false);
    }
  };

  const fetchTargetUsers = async (idInput = workshopId) => {
    const id = (idInput || "").trim();
    setError(null);
    setRows([]);

    if (!id) {
      setError("Select a workshop first.");
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
        booked: Boolean(u?.booked),
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

  const handleWorkshopSelect = async (workshop) => {
    const id = workshop?.workshop_id || "";
    setSelectedWorkshop(workshop);
    setWorkshopId(id);
    await fetchWorkshopPricing(workshop);
    await fetchTargetUsers(id);
  };

  const fetchWorkshopPricing = async (workshop) => {
    const workshopIdLocal = workshop?.workshop_id;
    const startingPrice = toAmount(workshop?.min_price);
    if (!workshopIdLocal) {
      setPriceSummary(null);
      return;
    }

    try {
      const response = await axios.get(`${baseUrl}crud/discounts/${workshopIdLocal}/`);
      const discounts = response.data?.discounts || [];
      const active = discounts.find((d) => d?.is_active !== false) || null;
      const discountType = (active?.discount_type || "").toLowerCase();
      const discountValue = toAmount(active?.discount_value) || 0;

      let flatDiscount = 0;
      if (startingPrice !== null) {
        if (discountType === "percentage") {
          flatDiscount = (startingPrice * discountValue) / 100;
        } else if (["flat", "flat_amount", "amount"].includes(discountType)) {
          flatDiscount = discountValue;
        }
      }

      const discountedPrice =
        startingPrice !== null ? Math.max(0, startingPrice - flatDiscount) : null;

      setPriceSummary({
        startingPrice,
        flatDiscount: flatDiscount > 0 ? flatDiscount : 0,
        discountedPrice,
      });
    } catch (e) {
      setPriceSummary({
        startingPrice,
        flatDiscount: 0,
        discountedPrice: startingPrice,
      });
    }
  };

  const sendPromoEmails = async () => {
    const id = workshopId.trim();
    setError(null);
    setSendInfo(null);

    if (!id) {
      setError("Load a workshop first.");
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
        skipped_already_booked: d.skipped_already_booked ?? 0,
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

  const getWhatsAppLink = (phone, name) => {
    const normalizedPhone = String(phone || "").replace(/[^\d]/g, "");
    if (!normalizedPhone) return "";
    const greetingName = name?.trim() || "there";
    const workshopName = selectedWorkshop?.name?.trim() || "our upcoming workshop";
    const workshopId = selectedWorkshop?.workshop_id;
    const bookingLink = workshopId ? `${render[mode]}/workshop/${workshopId}` : "";
    const workshopDate = formatWorkshopDate(selectedWorkshop?.start_date);
    const workshopTime =
      formatWorkshopTime(selectedWorkshop?.time || selectedWorkshop?.variants?.[0]?.time);
    const danceStyles = selectedWorkshop?.dance_styles || "Dance style TBA";
    const detailsLine = `${workshopDate} | ${workshopTime} | ${danceStyles} |`;
    const priceLine = priceSummary
      ? `~₹${Math.round(priceSummary.startingPrice || 0)}~ ₹${Math.round(
          priceSummary.discountedPrice || 0
        )} onwards`
      : "";
    const bookNowLine = bookingLink ? `Book now: ${bookingLink}` : "";
    const messageParts = [
      `Hi ${greetingName}, this is Team Nritya. We would love to invite you to ${workshopName}.`,
      detailsLine,
    ];
    if (priceLine) messageParts.push(priceLine);
    if (bookNowLine) messageParts.push(bookNowLine);
    const message = messageParts.join("\n\n");
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    if (hasLoadedInitialWorkshops.current) return;
    hasLoadedInitialWorkshops.current = true;
    fetchUpcomingWorkshops("Gurugram");
  }, []);

  return (
    <Box sx={{ p: 2, maxWidth: 1280, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Target Users CRM
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose environment and city, load upcoming workshops, then select one workshop to fetch
        target users and send promo emails.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Environment
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id="target-users-server">Server</InputLabel>
                <Select
                  labelId="target-users-server"
                  label="Server"
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setWorkshops([]);
                    setSelectedWorkshop(null);
                    setWorkshopId("");
                    setRows([]);
                    setSendInfo(null);
                  }}
                >
                  <MenuItem value="PRODUCTION">Production</MenuItem>
                  <MenuItem value="STAGING">Staging</MenuItem>
                  <MenuItem value="LOCAL">Local (127.0.0.1)</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <Autocomplete
                  options={citiesData.cities}
                  value={city}
                  onChange={(event, newValue) => setCity(newValue || "")}
                  onInputChange={(event, newInputValue) => setCity(newInputValue)}
                  freeSolo
                  fullWidth
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="City"
                      placeholder="Select or enter city"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <LocationIcon sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  )}
                />
                <Button
                  variant="contained"
                  startIcon={workshopsLoading ? null : <SearchIcon />}
                  onClick={() => fetchUpcomingWorkshops(city)}
                  disabled={workshopsLoading || loading || sending}
                  sx={{ minWidth: 170, whiteSpace: "nowrap" }}
                >
                  {workshopsLoading ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={18} color="inherit" />
                      <span>Loading…</span>
                    </Stack>
                  ) : (
                    "Load workshops"
                  )}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h6">Upcoming Workshops</Typography>
            <TextField
              size="small"
              label="Filter by name / ID"
              value={workshopFilter}
              onChange={(e) => setWorkshopFilter(e.target.value)}
              sx={{ minWidth: { sm: 300 } }}
            />
          </Stack>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Workshop ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkshops.length === 0 && !workshopsLoading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {workshops.length === 0
                        ? "No upcoming workshops found for this city."
                        : "No workshops match your filter."}
                    </TableCell>
                  </TableRow>
                )}
                {filteredWorkshops.map((w) => (
                  <TableRow
                    key={w.workshop_id}
                    selected={selectedWorkshop?.workshop_id === w.workshop_id}
                    hover
                  >
                    <TableCell>{w.workshop_id}</TableCell>
                    <TableCell>{w.name || "—"}</TableCell>
                    <TableCell>{w.city || "—"}</TableCell>
                    <TableCell>{w.start_date || "—"}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant={
                          selectedWorkshop?.workshop_id === w.workshop_id ? "contained" : "outlined"
                        }
                        onClick={() => handleWorkshopSelect(w)}
                        disabled={loading || sending}
                        size="small"
                      >
                        {selectedWorkshop?.workshop_id === w.workshop_id
                          ? "Loaded"
                          : "Load target users"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {selectedWorkshop && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Active workshop: <strong>{selectedWorkshop.name || "Untitled"}</strong> (
          {selectedWorkshop.workshop_id})
        </Alert>
      )}

      {selectedWorkshop && priceSummary && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <Chip
            color="default"
            variant="outlined"
            label={`Starting: ${formatInr(priceSummary.startingPrice)}`}
          />
          <Chip
            color="warning"
            variant="outlined"
            label={`Flat Discount: ${formatInr(priceSummary.flatDiscount)}`}
          />
          <Chip
            color="success"
            variant="outlined"
            label={`Now: ${formatInr(priceSummary.discountedPrice)}`}
          />
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />

      {selectedWorkshop && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={loading ? null : <SearchIcon />}
            onClick={() => fetchTargetUsers(workshopId)}
            disabled={loading || sending}
            sx={{ minWidth: 140 }}
          >
            {loading ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={18} color="inherit" />
                <span>Loading…</span>
              </Stack>
            ) : (
              "Reload users"
            )}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={sending ? null : <EmailIcon />}
            onClick={sendPromoEmails}
            disabled={loading || sending || sortedRows.length === 0}
            sx={{ minWidth: 180, whiteSpace: "nowrap" }}
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
          <Chip
            label={`${sortedRows.length} target user${sortedRows.length === 1 ? "" : "s"}`}
            color="primary"
            variant="outlined"
          />
        </Stack>
      )}

      {sendInfo && (
        <Alert
          severity={sendInfo.failed?.length ? "warning" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setSendInfo(null)}
        >
          Promo emails: sent {sendInfo.sent} of {sendInfo.total_recipients} target users.
          {sendInfo.skipped_already_booked > 0 &&
            ` Already booked (skipped): ${sendInfo.skipped_already_booked}.`}
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

      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h6">Recommended Target Users</Typography>
            <Chip
              color="info"
              variant="outlined"
              label={`Booked ${bookedCount}/${sortedRows.length}`}
            />
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Phone</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Booked</TableCell>
                  <TableCell align="right">WhatsApp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {selectedWorkshop
                        ? "No users returned for this workshop."
                        : "Select a workshop to load target users."}
                    </TableCell>
                  </TableRow>
                )}
                {sortedRows.map((r) => (
                  <TableRow key={r.phone}>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell>{r.buyer_name}</TableCell>
                    <TableCell>{r.buyer_email}</TableCell>
                    <TableCell align="center">
                      {r.booked ? (
                        <Chip size="small" label="Yes" color="success" variant="outlined" />
                      ) : (
                        <Chip size="small" label="No" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<WhatsAppIcon />}
                        href={getWhatsAppLink(r.phone, r.buyer_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        disabled={!getWhatsAppLink(r.phone, r.buyer_name)}
                      >
                        Share
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default TargetUsers;
