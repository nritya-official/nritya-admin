import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Link as MuiLink,
  Tooltip,
} from "@mui/material";
import {
  Instagram as InstagramIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import axios from "axios";
import MonthlyPerformanceChart, { formatInr } from "../Components/MonthlyPerformanceChart";

const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
  LOCAL: "http://127.0.0.1:8000/",
};

const MONTH_OPTIONS = [6, 12, 24];
const MAX_STYLE_CHIPS = 3;

const pct = (value) => (value == null ? "—" : `${(value * 100).toFixed(1)}%`);

const fillColor = (rate) => {
  if (rate == null) return "text.secondary";
  if (rate >= 0.75) return "success.main";
  if (rate >= 0.4) return "warning.main";
  return "error.main";
};

const KpiCard = ({ label, value, sub, color }) => (
  <Card variant="outlined" sx={{ height: "100%" }}>
    <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, color: color || "text.primary" }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const FillBar = ({ rate }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 120 }}>
    <LinearProgress
      variant="determinate"
      value={rate == null ? 0 : Math.min(100, rate * 100)}
      color={rate == null ? "inherit" : rate >= 0.75 ? "success" : rate >= 0.4 ? "warning" : "error"}
      sx={{ flex: 1, height: 6, borderRadius: 3 }}
    />
    <Typography variant="caption" sx={{ fontWeight: 700, color: fillColor(rate), minWidth: 46, textAlign: "right" }}>
      {pct(rate)}
    </Typography>
  </Box>
);

/**
 * Seats sold over capacity, on whichever basis is selected. Both figures have to
 * come from the same basis, otherwise an instructor whose only workshop is still
 * upcoming reads as "9 / 0".
 */
const SeatsCell = ({ row, concludedOnly }) => {
  const sold = concludedOnly ? row.concluded_seats_sold : row.seats_sold;
  const capacity = concludedOnly ? row.concluded_capacity : row.capacity;
  if (concludedOnly && !capacity) {
    return (
      <Typography variant="caption" color="text.secondary">
        Nothing concluded
      </Typography>
    );
  }
  return (
    <>
      {sold}
      <Typography component="span" variant="caption" color="text.secondary">
        {" "}
        / {capacity}
      </Typography>
    </>
  );
};

/**
 * Dance styles an instructor's workshops were listed under, most-taught first.
 *
 * Capped at three chips so one prolific instructor can't stretch the column;
 * the rest sit behind a tooltip on the overflow count.
 */
const StylesCell = ({ styles }) => {
  const list = styles || [];
  if (list.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }
  const shown = list.slice(0, MAX_STYLE_CHIPS);
  const hidden = list.slice(MAX_STYLE_CHIPS);
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {shown.map((style) => (
        <Chip key={style} size="small" variant="outlined" label={style} />
      ))}
      {hidden.length > 0 && (
        <Tooltip title={hidden.join(", ")}>
          <Chip size="small" label={`+${hidden.length}`} />
        </Tooltip>
      )}
    </Box>
  );
};

function CreatorAnalytics() {
  const [mode, setMode] = useState("PRODUCTION");
  const [owners, setOwners] = useState([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerInput, setOwnerInput] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(12);
  const [fillBasis, setFillBasis] = useState("all");
  const [error, setError] = useState(null);

  const baseUrl = server[mode];
  const concludedOnly = fillBasis === "concluded";
  const rateOf = (row) => (concludedOnly ? row?.fill_rate_concluded : row?.fill_rate);

  const fetchOwners = useCallback(async () => {
    setOwnersLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${baseUrl}n_admin/creator_owners/`);
      setOwners(res.data?.owners || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load owners");
      setOwners([]);
    } finally {
      setOwnersLoading(false);
    }
  }, [baseUrl]);

  const fetchAnalytics = useCallback(
    async (email, monthWindow = months) => {
      const target = (email || "").trim();
      if (!target) {
        setError("Pick an owner email first.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${baseUrl}n_admin/creator_analytics/`, {
          params: { owner_email: target, months: monthWindow },
        });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load analytics");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, months]
  );

  // Reload the owner list whenever the environment changes; the previous
  // environment's owners and figures are meaningless against a different DB.
  useEffect(() => {
    setData(null);
    setSelectedOwner(null);
    setOwnerInput("");
    fetchOwners();
  }, [fetchOwners]);

  const totals = data?.totals;
  const meta = data?.meta;
  const instructors = data?.instructors || [];
  const unattributed = data?.unattributed;
  // Memoised so the empty fallback keeps its identity between renders and the
  // reducers below don't re-run on every paint.
  const monthly = useMemo(() => data?.monthly || [], [data]);

  const windowRevenue = useMemo(
    () => monthly.reduce((sum, m) => sum + (Number(m.revenue) || 0), 0),
    [monthly]
  );
  const windowWorkshops = useMemo(
    () => monthly.reduce((sum, m) => sum + (Number(m.workshops_added) || 0), 0),
    [monthly]
  );

  const applyMonths = (value) => {
    setMonths(value);
    if (data?.owner_email) fetchAnalytics(data.owner_email, value);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1280, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Creator Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The same performance view an owner sees in their own dashboard: fill rate, revenue,
        monthly earnings, and workshops added, grouped by instructor Instagram handle. Pick an
        environment and an owner email.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Environment
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id="creator-analytics-server">Server</InputLabel>
                <Select
                  labelId="creator-analytics-server"
                  label="Server"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
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
                  fullWidth
                  size="small"
                  freeSolo
                  loading={ownersLoading}
                  options={owners}
                  value={selectedOwner}
                  inputValue={ownerInput}
                  onInputChange={(e, v) => setOwnerInput(v)}
                  getOptionLabel={(o) => (typeof o === "string" ? o : o.email)}
                  isOptionEqualToValue={(o, v) => o.email === (typeof v === "string" ? v : v?.email)}
                  renderOption={(props, o) => (
                    <li {...props} key={o.email}>
                      <Box sx={{ display: "flex", width: "100%", gap: 1 }}>
                        <Typography variant="body2" sx={{ mr: "auto" }}>
                          {o.email}
                        </Typography>
                        <Chip size="small" variant="outlined" label={`${o.workshops} ws`} />
                      </Box>
                    </li>
                  )}
                  onChange={(e, v) => {
                    setSelectedOwner(v);
                    const email = typeof v === "string" ? v : v?.email;
                    if (email) fetchAnalytics(email);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Owner email"
                      placeholder={ownersLoading ? "Loading owners…" : "Select or type an owner email"}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {ownersLoading ? <CircularProgress size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                  onClick={() => fetchAnalytics(ownerInput || selectedOwner?.email)}
                  disabled={loading}
                  sx={{ minWidth: 140, whiteSpace: "nowrap" }}
                >
                  {loading ? "Loading…" : "Load"}
                </Button>
                {data?.owner_email && (
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchAnalytics(data.owner_email)}
                    disabled={loading}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Refresh
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {owners.length} owner{owners.length === 1 ? "" : "s"} with workshops on {mode.toLowerCase()}.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!data && !loading && (
        <Alert severity="info">Pick an owner email above to load their analytics.</Alert>
      )}

      {data && data.owner_found === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No workshops found for <strong>{data.owner_email}</strong> on {mode.toLowerCase()}. Check
          the spelling, or try a different environment.
        </Alert>
      )}

      {data && data.owner_found !== false && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            Showing <strong>{data.owner_email}</strong>
          </Alert>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard
                label="Revenue earned"
                value={formatInr(totals?.revenue)}
                sub={`${totals?.bookings || 0} paid booking${totals?.bookings === 1 ? "" : "s"} · all time`}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard
                label={concludedOnly ? "Fill rate (concluded)" : "Fill rate (all)"}
                value={pct(rateOf(totals))}
                color={fillColor(rateOf(totals))}
                sub={
                  concludedOnly
                    ? `${totals?.concluded_seats_sold || 0} of ${totals?.concluded_capacity || 0} seats`
                    : `${totals?.seats_sold || 0} of ${totals?.capacity || 0} seats`
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard
                label="Seats sold"
                value={(totals?.seats_sold || 0).toLocaleString("en-IN")}
                sub={
                  totals?.revenue_per_seat != null
                    ? `${formatInr(totals.revenue_per_seat)} average per seat`
                    : "No seats sold yet"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard
                label="Workshops"
                value={(totals?.workshops || 0).toLocaleString("en-IN")}
                sub={`${windowWorkshops} added in the last ${months} months`}
              />
            </Grid>
          </Grid>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
                sx={{ mb: 1 }}
              >
                <Box sx={{ mr: "auto" }}>
                  <Typography variant="h6">Monthly earnings</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatInr(windowRevenue)} over the last {months} months
                  </Typography>
                </Box>
                <ToggleButtonGroup size="small" exclusive value={months} onChange={(e, v) => v && applyMonths(v)}>
                  {MONTH_OPTIONS.map((m) => (
                    <ToggleButton key={m} value={m} sx={{ textTransform: "none", px: 1.5 }}>
                      {m}m
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mb: 1 }} flexWrap="wrap">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: "#735EAB" }} />
                  <Typography variant="caption" color="text.secondary">
                    Earnings
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 12, height: 2, bgcolor: "success.main" }} />
                  <Typography variant="caption" color="text.secondary">
                    Workshops added
                  </Typography>
                </Stack>
              </Stack>

              <MonthlyPerformanceChart
                data={monthly}
                height={260}
                emptyMessage={`No earnings or workshops in the last ${months} months.`}
              />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
                sx={{ mb: 1.5 }}
              >
                <Box sx={{ mr: "auto" }}>
                  <Typography variant="h6">Performance by instructor</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Grouped by the Instagram handles tagged on each workshop. Dance styles are
                    collected from those workshops, most-taught first.
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={fillBasis}
                  onChange={(e, v) => v && setFillBasis(v)}
                >
                  {/* describeChild, otherwise MUI applies the tooltip text as
                      the button's aria-label and the visible label is lost. */}
                  <Tooltip describeChild title="Every workshop, including ones still on sale">
                    <ToggleButton value="all" sx={{ textTransform: "none", px: 1.5 }}>
                      All
                    </ToggleButton>
                  </Tooltip>
                  <Tooltip describeChild title="Only workshops whose date has passed — the fairer measure">
                    <ToggleButton value="concluded" sx={{ textTransform: "none", px: 1.5 }}>
                      Concluded only
                    </ToggleButton>
                  </Tooltip>
                </ToggleButtonGroup>
              </Stack>

              {meta?.handle_overlap && (
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Some workshops list more than one instructor, and each gets full credit, so these
                  rows add up to more than the owner&apos;s total.
                </Alert>
              )}

              {meta?.workshops_without_handles > 0 && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {meta.workshops_without_handles} of {totals?.workshops} workshops have no Instagram
                  handle, leaving {formatInr(unattributed?.revenue)} unattributed.
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Instructor</TableCell>
                      <TableCell align="right">Workshops</TableCell>
                      <TableCell align="right">Seats</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Dance styles</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>Fill rate</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {instructors.length === 0 && !unattributed?.workshops && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          No Instagram handles tagged on this owner&apos;s workshops.
                        </TableCell>
                      </TableRow>
                    )}
                    {instructors.map((row) => (
                      <TableRow key={row.handle} hover>
                        <TableCell>
                          <MuiLink
                            href={`https://www.instagram.com/${row.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 700 }}
                          >
                            <InstagramIcon sx={{ fontSize: 15 }} />@{row.handle}
                          </MuiLink>
                        </TableCell>
                        <TableCell align="right">{row.workshops}</TableCell>
                        <TableCell align="right">
                          <SeatsCell row={row} concludedOnly={concludedOnly} />
                        </TableCell>
                        <TableCell>
                          <StylesCell styles={row.dance_styles} />
                        </TableCell>
                        <TableCell>
                          <FillBar rate={rateOf(row)} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatInr(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {unattributed?.workshops > 0 && (
                      <TableRow hover>
                        <TableCell>
                          <Chip size="small" variant="outlined" label="No handle tagged" />
                        </TableCell>
                        <TableCell align="right">{unattributed.workshops}</TableCell>
                        <TableCell align="right">
                          <SeatsCell row={unattributed} concludedOnly={concludedOnly} />
                        </TableCell>
                        <TableCell>
                          <StylesCell styles={unattributed.dance_styles} />
                        </TableCell>
                        <TableCell>
                          <FillBar rate={rateOf(unattributed)} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatInr(unattributed.revenue)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Revenue is the owner&apos;s ticket subtotal on settled payments and excludes the
                platform booking fee. Fill rate is seats sold against published capacity. Months are
                Indian Standard Time. Seats come from booking items, not the
                WorkshopSubvariant.current_bookings cache, which is known to drift.
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}

export default CreatorAnalytics;
