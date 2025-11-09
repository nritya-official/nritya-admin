import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  People,
  Event,
  School,
  ExpandMore,
  Refresh,
  Download
} from '@mui/icons-material';

const PageTracking = () => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [activeTab, setActiveTab] = useState(0);
  const BASEURL_PROD= "https://djserver-production-ffe37b1b53b5.herokuapp.com/"
  const BASEURL_STAGING = "https://nrityaserver-2b241e0a97e5.herokuapp.com/"
  const BASEURL_DEV= "http://127.0.0.1:8000/"
  let baseUrl = '';

  if (selectedEnvironment === 'staging') {
    baseUrl = BASEURL_STAGING;
  } else if (selectedEnvironment === 'production') {
    baseUrl = BASEURL_PROD;
  } else {
    baseUrl = BASEURL_DEV;
  }

  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}crud/tracking/analytics/?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      } else {
        setError('Failed to fetch tracking data');
      }
    } catch (err) {
      setError('Error fetching tracking data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [selectedDate, selectedEnvironment]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const exportData = () => {
    if (!trackingData) return;
    
    const csvContent = generateCSV(trackingData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-tracking-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data) => {
    let csv = 'User ID,Studio Visits,Workshop Visits,Total Visits\n';
    
    Object.entries(data.users_data).forEach(([userId, userData]) => {
      const studioVisits = userData.ST?.length || 0;
      const workshopVisits = userData.WK?.length || 0;
      const totalVisits = studioVisits + workshopVisits;
      
      csv += `${userId},${studioVisits},${workshopVisits},${totalVisits}\n`;
    });
    
    return csv;
  };

  const getTopEntities = (type) => {
    if (!trackingData?.analytics) return [];
    
    return Object.entries(trackingData.analytics)
      .filter(([key]) => key.startsWith(type))
      .map(([key, count]) => ({
        entityId: key.replace(`${type}_`, ''),
        count: parseInt(count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Analytics color="primary" />
        Page Tracking Analytics
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  label="Environment"
                >
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="local">Local</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchTrackingData}
                disabled={loading}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportData}
                disabled={!trackingData}
                fullWidth
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {trackingData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People color="primary" />
                    <Typography variant="h6">Total Users</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {trackingData.summary?.total_users || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School color="secondary" />
                    <Typography variant="h6">Studio Visits</Typography>
                  </Box>
                  <Typography variant="h4" color="secondary">
                    {trackingData.summary?.total_studio_visits || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event color="success" />
                    <Typography variant="h6">Workshop Visits</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {trackingData.summary?.total_workshop_visits || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="warning" />
                    <Typography variant="h6">Total Visits</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {(trackingData.summary?.total_studio_visits || 0) + (trackingData.summary?.total_workshop_visits || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="User Details" />
                <Tab label="Top Studios" />
                <Tab label="Top Workshops" />
                <Tab label="Raw Data" />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User ID</TableCell>
                      <TableCell align="center">Studio Visits</TableCell>
                      <TableCell align="center">Workshop Visits</TableCell>
                      <TableCell align="center">Total Visits</TableCell>
                      <TableCell>Studios Visited</TableCell>
                      <TableCell>Workshops Visited</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(trackingData.users_data).map(([userId, userData]) => (
                      <TableRow key={userId}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {userId}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={userData.ST?.length || 0} 
                            color="secondary" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={userData.WK?.length || 0} 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={(userData.ST?.length || 0) + (userData.WK?.length || 0)} 
                            color="primary" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {userData.ST?.join(', ') || 'None'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {userData.WK?.join(', ') || 'None'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography variant="h6" gutterBottom>
                Top 10 Most Visited Studios
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Studio ID</TableCell>
                      <TableCell align="center">Visit Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopEntities('ST').map((entity, index) => (
                      <TableRow key={entity.entityId}>
                        <TableCell>
                          <Chip label={`#${index + 1}`} color="primary" size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {entity.entityId}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={entity.count} color="secondary" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Typography variant="h6" gutterBottom>
                Top 10 Most Visited Workshops
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Workshop ID</TableCell>
                      <TableCell align="center">Visit Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopEntities('WK').map((entity, index) => (
                      <TableRow key={entity.entityId}>
                        <TableCell>
                          <Chip label={`#${index + 1}`} color="primary" size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {entity.entityId}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={entity.count} color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Typography variant="h6" gutterBottom>
                Raw Tracking Data
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Users Data (JSON)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '16px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(trackingData.users_data, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Analytics Data (JSON)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '16px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(trackingData.analytics, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            </TabPanel>
          </Card>
        </>
      )}
    </Box>
  );
};

export default PageTracking;



