import React, { useState } from 'react';
import { getFTBByEmail } from '../utils/firebaseUtils';
import { Card, CardContent, Typography, TextField, Button, Select, MenuItem, Grid } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, Box, Alert, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';

function Bookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('email_learner');
  const [searchResults, setSearchResults] = useState([]);

  // New Workshop Bookings state
  const [wbTab, setWbTab] = useState(0); // 0: Booking ID, 1: User ID, 2: Workshop ID
  const [wbQuery, setWbQuery] = useState('');
  const [wbEnv, setWbEnv] = useState('production'); // 'production' | 'staging'
  const [wbLoading, setWbLoading] = useState(false);
  const [wbError, setWbError] = useState('');
  const [wbRows, setWbRows] = useState([]);
  const [webappEnv, setWebappEnv] = useState('production');

  const API_BASES = {
    production: 'https://djserver-production-ffe37b1b53b5.herokuapp.com/',
    staging: 'https://nrityaserver-2b241e0a97e5.herokuapp.com/',
    dev: 'http://localhost:8000/'
  };

  const WEBAPP_BASES = {
    production: 'https://www.nritya.co.in/',
    staging: 'https://nritya-webapp-ssr-1-b3a1c0b4b8f2.herokuapp.com/'
  };

  const handleSearch = async () => {
    try {
      if (!searchQuery.trim()) return; // Do not search if query is empty or contains only whitespace

      const data = await getFTBByEmail(searchQuery.trim(), 'FreeTrialBookings', selectedFilter);
      setSearchResults(data ? data : []); // If data is found, put it in an array, otherwise empty array
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSearchResults([]);
    }
  };

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const handleWbTabChange = (_e, v) => {
    setWbTab(v);
    setWbQuery('');
    setWbError('');
    setWbRows([]);
  };

  const fetchJSON = async (base, path) => {
    const res = await fetch(`${base}${path}`, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const handleWbSearch = async () => {
    if (!wbQuery.trim()) {
      setWbError('Please enter a search query');
      return;
    }
    setWbLoading(true);
    setWbError('');
    setWbRows([]);
    const base = API_BASES[wbEnv];
    try {
      if (wbTab === 0) {
        // Booking ID
        const data = await fetchJSON(base, `payments/workshop_booking?booking_id=${encodeURIComponent(wbQuery.trim())}`);
        if (data?.success && data.booking) {
          setWbRows([data.booking]);
        } else {
          setWbError(data?.message || 'Booking not found');
        }
      } else if (wbTab === 1) {
        // User ID
        const data = await fetchJSON(base, `payments/workshop_bookings?user_id=${encodeURIComponent(wbQuery.trim())}`);
        if (data?.success && Array.isArray(data.bookings)) {
          setWbRows(data.bookings);
        } else {
          setWbError('No bookings found for this user');
        }
      } else {
        // Workshop ID via transactions endpoint (contains embedded booking summary)
        const data = await fetchJSON(base, `payments/transactions/workshop/${encodeURIComponent(wbQuery.trim())}`);
        const rows = Array.isArray(data?.transactions)
          ? data.transactions
              .map(t => t.booking)
              .filter(Boolean)
          : [];
        if (rows.length === 0) setWbError('No bookings for this workshop');
        setWbRows(rows);
      }
    } catch (e) {
      setWbError(`Failed to fetch: ${e.message}`);
    } finally {
      setWbLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleString(); } catch { return 'N/A'; }
  };

  const openTicket = (bookingId) => {
    const base = WEBAPP_BASES[webappEnv];
    const url = `${base.replace(/\/$/, '')}/ticket/${bookingId}`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          style={{ marginRight: '8px',flex: 1  }}
        />
        <Select
          value={selectedFilter}
          onChange={handleFilterChange}
          style={{ marginRight: '8px' }}
        >
          <MenuItem value="email_learner">Email (Learner)</MenuItem>
          <MenuItem value="email_studio">Email (Studio)</MenuItem>
          <MenuItem value="name_studio">Name (Studio)</MenuItem>
          <MenuItem value="name_class">Name (Class)</MenuItem>
        </Select>
        <Button variant="contained" onClick={handleSearch}>Search</Button>
      </div>
      
      <div>
      {searchResults.length > 0 ? (
        <Grid container spacing={2}>
          {searchResults.map(result => (
            <Grid item key={result.id} xs={12} sm={6} md={4} lg={3}>
            <Card style={{ marginBottom: '16px' }}>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableBody>
                      {Object.entries(result).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row">
                            {key}
                          </TableCell>
                          <TableCell align="left">
                            {value !== null && value !== undefined ? value.toString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1">
          No results found.
        </Typography>
      )}
    </div>

      {/* Workshop Bookings Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Workshop Bookings</Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="body2">API:</Typography>
          </Grid>
          <Grid item>
            <ToggleButtonGroup size="small" value={wbEnv} exclusive onChange={(_e, v) => v && setWbEnv(v)}>
              <ToggleButton value="production">Production</ToggleButton>
              <ToggleButton value="staging">Staging</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item>
            <Typography variant="body2">Webapp:</Typography>
          </Grid>
          <Grid item>
            <ToggleButtonGroup size="small" value={webappEnv} exclusive onChange={(_e, v) => v && setWebappEnv(v)}>
              <ToggleButton value="production">Production</ToggleButton>
              <ToggleButton value="staging">Staging</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={wbTab} onChange={handleWbTabChange}>
            <Tab label="By Booking ID" />
            <Tab label="By User ID" />
            <Tab label="By Workshop ID" />
          </Tabs>
        </Box>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              value={wbQuery}
              onChange={(e) => setWbQuery(e.target.value)}
              placeholder={wbTab === 0 ? 'Enter booking ID' : wbTab === 1 ? 'Enter user ID' : 'Enter workshop ID'}
              onKeyPress={(e) => e.key === 'Enter' && handleWbSearch()}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <Button fullWidth variant="contained" onClick={handleWbSearch} disabled={wbLoading}>
              {wbLoading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Grid>
        </Grid>

        {wbError && (
          <Alert severity="error" sx={{ mb: 2 }}>{wbError}</Alert>
        )}

        {wbRows.length > 0 && (
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
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wbRows.map((b) => (
                  <TableRow key={b.booking_id}>
                    <TableCell>{b.booking_id}</TableCell>
                    <TableCell>{b.workshop_id}</TableCell>
                    <TableCell>{b.buyer_name || 'N/A'}</TableCell>
                    <TableCell>{b.buyer_email || 'N/A'}</TableCell>
                    <TableCell>{b.buyer_phone || 'N/A'}</TableCell>
                    <TableCell>{formatDate(b.created_at)}</TableCell>
                    <TableCell>{Array.isArray(b.items) ? b.items.length : (typeof b.total_amount !== 'undefined' ? '-' : 0)}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => openTicket(b.booking_id)}>
                        Open Ticket
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

    </div>
  );
}

export default Bookings;
