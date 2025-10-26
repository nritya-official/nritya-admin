import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { jsPDF } from 'jspdf';

function Tickets() {
  const [activeTab, setActiveTab] = useState(0); // 0: booking_id, 1: user_id
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [sendingIndex, setSendingIndex] = useState(-1);

  // Inline API base used elsewhere in admin
  const API_BASE_URL = 'https://nrityaserver-2b241e0a97e5.herokuapp.com/';

  const handleTabChange = (_e, newValue) => {
    setActiveTab(newValue);
    setSearchQuery('');
    setError('');
    setBookings([]);
  };

  const fetchJSON = async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    setLoading(true);
    setError('');
    setBookings([]);
    try {
      if (activeTab === 0) {
        // Search by booking_id
        const data = await fetchJSON(`payments/workshop_booking?booking_id=${encodeURIComponent(searchQuery.trim())}`);
        if (data && data.success && data.booking) {
          setBookings([data.booking]);
        } else {
          setError(data?.message || 'Booking not found');
        }
      } else {
        // Search by user_id
        const data = await fetchJSON(`payments/workshop_bookings?user_id=${encodeURIComponent(searchQuery.trim())}`);
        if (data && data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else {
          setError('No bookings found for this user');
        }
      }
    } catch (e) {
      setError(`Failed to fetch: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleString(); } catch { return 'N/A'; }
  };

  const fetchWorkshopMeta = async (workshopId) => {
    const meta = await fetchJSON(`djCrud/get_workshop_by_id/${encodeURIComponent(workshopId)}`);
    // Expecting keys: name, geolocation
    const workshop_name = meta?.name || meta?.workshopName || 'Workshop';
    let geolocation = '';
    if (typeof meta?.geolocation === 'string') {
      geolocation = meta.geolocation;
    } else if (meta?.geolocation && meta.geolocation.latitude && meta.geolocation.longitude) {
      geolocation = `${meta.geolocation.latitude},${meta.geolocation.longitude}`;
    }
    return { workshop_name, geolocation };
  };

  const generatePdfBase64 = (booking) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 20;
    doc.setFontSize(16);
    doc.text('Nritya Workshop Ticket', 14, y); y += 8;
    doc.setFontSize(12);
    doc.text(`Booking ID: ${booking.booking_id}`, 14, y); y += 6;
    doc.text(`Workshop ID: ${booking.workshop_id}`, 14, y); y += 6;
    doc.text(`Buyer: ${booking.buyer_name || 'N/A'}`, 14, y); y += 6;
    doc.text(`Email: ${booking.buyer_email || 'N/A'}`, 14, y); y += 6;
    doc.text(`Phone: ${booking.buyer_phone || 'N/A'}`, 14, y); y += 8;

    doc.text('Items:', 14, y); y += 6;
    if (Array.isArray(booking.items)) {
      booking.items.forEach((it, idx) => {
        const line = `${idx + 1}. ${it.variant_description} | ${it.subvariant_description} | ${it.date} ${it.time} | Qty: ${it.quantity} | ₹${it.subtotal}`;
        const split = doc.splitTextToSize(line, 180);
        split.forEach((s) => { doc.text(s, 16, y); y += 6; });
        y += 2;
      });
    }

    return doc.output('datauristring').split(',')[1];
  };

  const handleSend = async (rowIndex, booking, emailValue) => {
    try {
      setSendingIndex(rowIndex);
      const { workshop_name, geolocation } = await fetchWorkshopMeta(booking.workshop_id);
      const pdfBase64 = generatePdfBase64(booking);

      const payload = {
        email: emailValue,
        workshop_name,
        workshop_id: booking.workshop_id,
        geolocation,
        pdf_data: pdfBase64
      };

      const res = await fetch(`${API_BASE_URL}emailer/send_ticket_email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to send email');
      alert('Ticket email sent successfully');
    } catch (e) {
      alert(`Failed to send: ${e.message}`);
    } finally {
      setSendingIndex(-1);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tickets
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Search by Booking ID" />
          <Tab label="Search by User ID" />
        </Tabs>
      </Box>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 0 ? 'Enter booking ID' : 'Enter user ID'}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </Grid>
        <Grid item xs={12} sm={3} md={2}>
          <Button fullWidth variant="contained" onClick={handleSearch} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Search'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {bookings.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Booking ID</strong></TableCell>
                <TableCell><strong>Workshop ID</strong></TableCell>
                <TableCell><strong>Buyer</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>Send To</strong></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((b, idx) => (
                <TableRow key={b.booking_id}>
                  <TableCell>{b.booking_id}</TableCell>
                  <TableCell>{b.workshop_id}</TableCell>
                  <TableCell>{b.buyer_name || 'N/A'}</TableCell>
                  <TableCell>{b.buyer_email || 'N/A'}</TableCell>
                  <TableCell>{b.buyer_phone || 'N/A'}</TableCell>
                  <TableCell>{formatDate(b.created_at)}</TableCell>
                  <TableCell>{Array.isArray(b.items) ? b.items.length : 0}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      defaultValue={b.buyer_email || ''}
                      onChange={(e) => { b.__send_to = e.target.value; }}
                      placeholder="recipient@example.com"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={sendingIndex === idx}
                      onClick={() => handleSend(idx, b, (b.__send_to || b.buyer_email || '').trim())}
                    >
                      {sendingIndex === idx ? <CircularProgress size={16} /> : 'Send'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {bookings.length === 0 && !loading && !error && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Search for a booking by Booking ID or list all bookings for a User ID.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Tickets;
