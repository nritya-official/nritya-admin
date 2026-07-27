import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
  LOCAL: "http://127.0.0.1:8000/",
};

const SORTS = [
  { value: "seats", label: "Seats booked" },
  { value: "workshops", label: "Workshop count" },
  { value: "revenue", label: "Revenue" },
  { value: "recent", label: "Most recent workshop" },
  { value: "handle", label: "Handle (A–Z)" },
];

const MAX_STYLE_CHIPS = 3;
const SEARCH_DEBOUNCE_MS = 350;

const formatInr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Backend sends ISO dates; admins here read dd/mm/yyyy. */
const formatDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const StyleChips = ({ styles }) => {
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

/** Studio emails are long, so collapse to a count and put the list in a tooltip. */
const StudiosCell = ({ studios }) => {
  const list = studios || [];
  if (list.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }
  if (list.length === 1) {
    return (
      <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
        {list[0]}
      </Typography>
    );
  }
  return (
    <Tooltip title={list.join(", ")}>
      <Chip size="small" color="primary" variant="outlined" label={`${list.length} studios`} />
    </Tooltip>
  );
};

/**
 * Platform-wide directory of the Instagram handles tagged on workshops.
 *
 * Distinct from the per-studio view in Creator Analytics: an operator arrives
 * here knowing only a handle or a dance style, not which studio booked them,
 * so search runs across every workshop regardless of owner.
 */
function InstaInstructors() {
  const [mode, setMode] = useState("PRODUCTION");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("seats");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced so typing doesn't fire a request per keystroke; the endpoint
  // aggregates every workshop on the platform and takes about a second.
  const timer = useRef(null);
  useEffect(() => {
    timer.current = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [search]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${server[mode]}n_admin/insta_instructors/`, {
        params: { q: query, sort, limit: rowsPerPage, offset: page * rowsPerPage },
      });
      setData(res.data);
    } catch (err) {
      // Deliberately keep the last good page on screen. Blanking the table on a
      // failed refresh loses the operator's place and leaves TablePagination
      // pointing at a page that no longer exists.
      setError(err.response?.data?.error || err.message || "Failed to load instructors");
    } finally {
      setLoading(false);
    }
  }, [mode, query, sort, page, rowsPerPage]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const rows = data?.instructors || [];
  const totals = data?.totals;
  const meta = data?.meta;

  // Clamped so the control can never be handed a page beyond the result count,
  // which MUI warns about and which would otherwise strand the operator on an
  // empty page after a search narrows the results.
  const matched = meta?.matched || 0;
  const lastPage = Math.max(0, Math.ceil(matched / rowsPerPage) - 1);
  const safePage = Math.min(page, lastPage);

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Instagram instructors</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Every instructor handle tagged on any workshop, across all studios. Search by handle,
            dance style, city, studio email or workshop title.
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. bhangra, mansigarg411, Gurugram"
                label="Search"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="insta-sort-label">Sort by</InputLabel>
                <Select
                  labelId="insta-sort-label"
                  id="insta-sort"
                  label="Sort by"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(0);
                  }}
                >
                  {SORTS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="insta-env-label">Environment</InputLabel>
                <Select
                  labelId="insta-env-label"
                  id="insta-env"
                  label="Environment"
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="PRODUCTION">Production</MenuItem>
                  <MenuItem value="STAGING">Staging</MenuItem>
                  <MenuItem value="LOCAL">Local</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {totals && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}
            >
              <Chip size="small" label={`${totals.distinct_handles} instructors`} />
              <Chip size="small" label={`${totals.workshops} workshops`} />
              <Chip size="small" label={`${totals.seats_sold} seats booked`} />
              <Chip size="small" label={formatInr(totals.revenue)} />
              {totals.workshops_without_handles > 0 && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`${totals.workshops_without_handles} workshops untagged`}
                />
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {meta?.attribution && rows.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {meta.attribution}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Loading instructors…
              </Typography>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Instructor</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Dance styles</TableCell>
                  <TableCell align="right">Workshops</TableCell>
                  <TableCell align="right">Seats booked</TableCell>
                  <TableCell>Studios</TableCell>
                  <TableCell align="right">Last workshop</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      {query
                        ? `No instructor matches “${query}”.`
                        : "No instructor handles tagged on any workshop yet."}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.handle} hover>
                    <TableCell>
                      <MuiLink
                        href={`https://www.instagram.com/${row.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontWeight: 700,
                        }}
                      >
                        <InstagramIcon sx={{ fontSize: 15 }} />@{row.handle}
                      </MuiLink>
                    </TableCell>
                    <TableCell>
                      <StyleChips styles={row.dance_styles} />
                    </TableCell>
                    <TableCell align="right">{row.workshops}</TableCell>
                    <TableCell align="right">
                      {row.seats_sold}
                      <Typography component="span" variant="caption" color="text.secondary">
                        {" "}
                        / {row.capacity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StudiosCell studios={row.studios} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">{formatDate(row.last_workshop)}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={matched}
            page={safePage}
            onPageChange={(e, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
          />

          <Typography variant="caption" color="text.secondary">
            Seats booked are ticket quantities on settled payments, out of published capacity.
            Revenue excludes the platform booking fee. Dance styles come from the workshops each
            handle is tagged on, most-taught first.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default InstaInstructors;
