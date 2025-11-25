import { useState, useEffect } from "react";
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
  Chip,
  Stack,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Link,
  CircularProgress,
} from "@mui/material";
import {
  DateRange as DateRangeIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import axios from "axios";
import { BASEURL_PROD } from "../constants";

const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
};

const render = {
  PRODUCTION: "https://www.nritya.co.in/",
  STAGING: "https://nritya-webapp-ssr-1-b3a1c0b4b8f2.herokuapp.com/",
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function WorkshopBookingMonitor() {
  const [mode, setMode] = useState("STAGING");
  const [dateRange, setDateRange] = useState("7"); // 7, 30, 60, or "custom"
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workshopIdFilter, setWorkshopIdFilter] = useState("");
  
  // Custom date range
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const baseUrlServer = server[mode];
  const baseUrlRender = render[mode];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${baseUrlServer}payments/all_workshop_bookings?`;
      
      // Add workshop_id filter if provided
      if (workshopIdFilter.trim()) {
        url += `workshop_id=${workshopIdFilter.trim()}&`;
      }
      
      // Add date range parameters
      if (dateRange === "custom") {
        if (startDate && endDate) {
          url += `start_date=${startDate}&end_date=${endDate}`;
        } else {
          setError("Please provide both start and end dates for custom range");
          setLoading(false);
          return;
        }
      } else {
        url += `days=${dateRange}`;
      }

      console.log("Fetching bookings from:", url);
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        setBookings(response.data.bookings || []);
      } else {
        setError(response.data.message || "Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [mode]); // Auto-fetch when mode changes

  const handleDateRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setDateRange(newValue);
      // Auto-fetch for preset ranges (not custom)
      if (newValue !== "custom") {
        // We'll trigger fetch on button click instead
      }
    }
  };

  const getReviewLink = (userId, workshopId) => {
    if (!userId || !workshopId) return null;
    return `${baseUrlRender}workshopExperience/${userId}/${workshopId}`;
  };

  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto", fontFamily: "sans-serif" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Workshop Booking Monitor
      </Typography>

      {/* Mode Select */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold", color: "text.secondary" }}>
          Environment
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, newValue) => newValue && setMode(newValue)}
          aria-label="environment"
          fullWidth
          sx={{
            "& .MuiToggleButton-root": {
              flex: 1,
              py: 1.5,
              border: "2px solid",
              borderColor: "divider",
              "&.Mui-selected": {
                backgroundColor: mode === "STAGING" ? "warning.main" : "success.main",
                color: "white",
                borderColor: mode === "STAGING" ? "warning.main" : "success.main",
                "&:hover": {
                  backgroundColor: mode === "STAGING" ? "warning.dark" : "success.dark",
                },
              },
            },
          }}
        >
          <ToggleButton value="STAGING" aria-label="staging">
            Staging
          </ToggleButton>
          <ToggleButton value="PRODUCTION" aria-label="production">
            Production
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <DateRangeIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Filters
            </Typography>
          </Box>

          {/* Workshop ID Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "text.secondary" }}>
              Workshop ID (Optional)
            </Typography>
            <TextField
              label="Enter Workshop ID"
              value={workshopIdFilter}
              onChange={(e) => setWorkshopIdFilter(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Leave empty to see all workshops"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Date Range Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "text.secondary" }}>
              Date Range
            </Typography>
            <ToggleButtonGroup
              value={dateRange}
              exclusive
              onChange={handleDateRangeChange}
              aria-label="date range"
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  flex: 1,
                  py: 1.5,
                  border: "2px solid",
                  borderColor: "divider",
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    borderColor: "primary.main",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="7" aria-label="last 7 days">
                Last 7 Days
              </ToggleButton>
              <ToggleButton value="30" aria-label="last 30 days">
                Last 30 Days
              </ToggleButton>
              <ToggleButton value="60" aria-label="last 60 days">
                Last 60 Days
              </ToggleButton>
              <ToggleButton value="custom" aria-label="custom range">
                Custom Range
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Custom Date Range Inputs */}
          {dateRange === "custom" && (
            <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          )}

          {/* Fetch Button */}
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={fetchBookings}
            fullWidth
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: "1.1rem",
              fontWeight: "bold",
              textTransform: "none",
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            {loading ? "Loading..." : "Fetch Bookings"}
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: "error.light", borderRadius: 2 }}>
          <Typography color="error.dark" sx={{ fontWeight: "bold" }}>
            Error: {error}
          </Typography>
        </Box>
      )}

      {/* Results Summary */}
      {!loading && bookings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Total Bookings: ${bookings.length}`}
            color="primary"
            sx={{ fontSize: "1rem", fontWeight: "bold", py: 2.5 }}
          />
        </Box>
      )}

      {/* Bookings Table */}
      {!loading && bookings.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Booking ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Buyer Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Buyer Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Buyer Phone</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Workshop ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Booking Date</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Review Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking, index) => {
                const reviewLink = getReviewLink(booking.user_id, booking.workshop_id);
                return (
                  <TableRow key={booking.booking_id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {booking.booking_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{booking.buyer_name}</TableCell>
                    <TableCell>
                      <Link href={`mailto:${booking.buyer_email}`} underline="hover">
                        {booking.buyer_email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {booking.buyer_phone ? (
                        <Link href={`tel:${booking.buyer_phone}`} underline="hover">
                          {booking.buyer_phone}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${baseUrlRender}workshop/${booking.workshop_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {booking.workshop_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {booking.user_id || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: "bold", color: "success.main" }}>
                        ₹{booking.total_amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {reviewLink ? (
                        <Button
                          variant="outlined"
                          size="small"
                          href={reviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<OpenInNewIcon />}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                          }}
                        >
                          Review
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* No Results Message */}
      {!loading && bookings.length === 0 && !error && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No bookings found for the selected filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your filters or selecting a different date range
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default WorkshopBookingMonitor;




