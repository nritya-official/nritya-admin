import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Stack,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import axios from 'axios';

const SERVER_URLS = {
  PRODUCTION: 'https://djserver-production-ffe37b1b53b5.herokuapp.com/',
  STAGING: 'https://nrityaserver-2b241e0a97e5.herokuapp.com/'
};

const ITEMS_PER_PAGE = 50;

function Transactions() {
  // Environment and view mode
  const [environment, setEnvironment] = useState('STAGING');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Search and filter
  const [searchType, setSearchType] = useState('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Data
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const baseUrl = SERVER_URLS[environment];

  // Format helpers
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'success':
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
      case 'initiated':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  // Fetch transactions
  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let url = `${baseUrl}payments/transactions?limit=${ITEMS_PER_PAGE}&offset=${offset}`;

      // Add search filters
      if (searchQuery.trim()) {
        switch (searchType) {
          case 'email':
            url += `&user_email=${encodeURIComponent(searchQuery.trim())}`;
            break;
          case 'user_id':
            url += `&user_id=${encodeURIComponent(searchQuery.trim())}`;
            break;
          case 'transaction_id':
            url += `&transaction_id=${encodeURIComponent(searchQuery.trim())}`;
            break;
          case 'razorpay_payment_id':
            url += `&razorpay_payment_id=${encodeURIComponent(searchQuery.trim())}`;
            break;
          case 'razorpay_order_id':
            url += `&razorpay_order_id=${encodeURIComponent(searchQuery.trim())}`;
            break;
          default:
            break;
        }
      }

      // Add status filter
      if (statusFilter !== 'all') {
        url += `&payment_status=${statusFilter}`;
      }

      // Add date filters
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
        setTotalCount(response.data.total_count || 0);
        
        if (response.data.transactions?.length === 0) {
          setError('No transactions found for the given criteria');
        }
      } else {
        setError(response.data.message || 'Failed to fetch transactions');
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Error fetching transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleEnvironmentChange = (event, newEnvironment) => {
    if (newEnvironment !== null) {
      setEnvironment(newEnvironment);
      setTransactions([]);
      setCurrentPage(1);
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions(1);
  };

  const handleRefresh = () => {
    fetchTransactions(currentPage);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchTransactions(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'User ID',
      'User Email',
      'Payment Status',
      'Payment Method',
      'Subtotal',
      'Booking Fee',
      'Total Amount',
      'Razorpay Payment ID',
      'Razorpay Order ID',
      'Error Code',
      'Error Reason',
      'Created At'
    ];

    const csvData = transactions.map(t => [
      t.transaction_id || '',
      t.user_id || '',
      t.user_email || '',
      t.payment_status || '',
      t.payment_method || '',
      t.subtotal || '',
      t.booking_fee || '',
      t.total_amount || '',
      t.razorpay_payment_id || '',
      t.razorpay_order_id || '',
      t.error_code || '',
      t.error_reason || '',
      t.created_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${environment}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Load all transactions on mount
  useEffect(() => {
    fetchTransactions(1);
  }, [environment]);

  // Render transaction card
  const renderTransactionCard = (transaction) => (
    <Grid item key={transaction.transaction_id} xs={12} sm={6} md={4}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              {transaction.transaction_id}
            </Typography>
            <Chip 
              label={transaction.payment_status || 'Unknown'} 
              color={getStatusColor(transaction.payment_status)}
              size="small"
            />
          </Box>

          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">User Email</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {transaction.user_email || 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">User ID</Typography>
              <Typography variant="body2">{transaction.user_id || 'N/A'}</Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{formatAmount(transaction.subtotal)}</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Booking Fee</Typography>
              <Typography variant="body2">{formatAmount(transaction.booking_fee)}</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight="bold">Total Amount</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatAmount(transaction.total_amount)}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary">Payment Method</Typography>
              <Typography variant="body2">{transaction.payment_method || 'N/A'}</Typography>
            </Box>

            {transaction.razorpay_payment_id && (
              <Box>
                <Typography variant="caption" color="text.secondary">Razorpay Payment ID</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                  {transaction.razorpay_payment_id}
                </Typography>
              </Box>
            )}

            {transaction.razorpay_order_id && (
              <Box>
                <Typography variant="caption" color="text.secondary">Razorpay Order ID</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                  {transaction.razorpay_order_id}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary">Created At</Typography>
              <Typography variant="body2">{formatDate(transaction.created_at)}</Typography>
            </Box>

            {transaction.error_code && (
              <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                <Typography variant="caption">
                  <strong>Error:</strong> {transaction.error_code}
                  {transaction.error_reason && ` - ${transaction.error_reason}`}
                </Typography>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );

  // Render transaction table
  const renderTransactionTable = () => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell><strong>Transaction ID</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>User Email</strong></TableCell>
            <TableCell><strong>User ID</strong></TableCell>
            <TableCell align="right"><strong>Subtotal</strong></TableCell>
            <TableCell align="right"><strong>Fee</strong></TableCell>
            <TableCell align="right"><strong>Total</strong></TableCell>
            <TableCell><strong>Payment Method</strong></TableCell>
            <TableCell><strong>Razorpay Payment ID</strong></TableCell>
            <TableCell><strong>Razorpay Order ID</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
            <TableCell><strong>Error</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.transaction_id}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell sx={{ fontSize: '0.75rem' }}>{transaction.transaction_id || 'N/A'}</TableCell>
              <TableCell>
                <Chip 
                  label={transaction.payment_status || 'Unknown'} 
                  color={getStatusColor(transaction.payment_status)}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {transaction.user_email || 'N/A'}
              </TableCell>
              <TableCell>{transaction.user_id || 'N/A'}</TableCell>
              <TableCell align="right">{formatAmount(transaction.subtotal)}</TableCell>
              <TableCell align="right">{formatAmount(transaction.booking_fee)}</TableCell>
              <TableCell align="right"><strong>{formatAmount(transaction.total_amount)}</strong></TableCell>
              <TableCell>{transaction.payment_method || 'N/A'}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {transaction.razorpay_payment_id || 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.7rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {transaction.razorpay_order_id || 'N/A'}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(transaction.created_at)}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {transaction.error_code ? `${transaction.error_code}: ${transaction.error_reason || ''}` : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Transaction Management
        </Typography>
        
        <ToggleButtonGroup
          value={environment}
          exclusive
          onChange={handleEnvironmentChange}
          size="small"
        >
          <ToggleButton value="STAGING">Staging</ToggleButton>
          <ToggleButton value="PRODUCTION">Production</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search Type */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchType}
                  label="Search By"
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="user_id">User ID</MenuItem>
                  <MenuItem value="transaction_id">Transaction ID</MenuItem>
                  <MenuItem value="razorpay_payment_id">Razorpay Payment ID</MenuItem>
                  <MenuItem value="razorpay_order_id">Razorpay Order ID</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Search Query */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Enter ${searchType.replace('_', ' ')}`}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Success">Success</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                  <MenuItem value="Refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                  disabled={transactions.length === 0}
                >
                  Export CSV
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Header */}
      {transactions.length > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {totalCount.toLocaleString()} transaction(s) found
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="table">
              <Tooltip title="Table View">
                <ViewListIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="cards">
              <Tooltip title="Card View">
                <ViewModuleIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={5}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert severity={transactions.length === 0 ? "warning" : "info"} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {!loading && transactions.length > 0 && (
        <>
          {viewMode === 'cards' ? (
            <Grid container spacing={2}>
              {transactions.map(renderTransactionCard)}
            </Grid>
          ) : (
            renderTransactionTable()
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && transactions.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No transactions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search filters or load all transactions
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default Transactions;
