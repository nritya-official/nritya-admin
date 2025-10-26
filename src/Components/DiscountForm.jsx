import React, { useState } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Paper,
  Alert
} from '@mui/material';
import { BASEURL } from '../services/studioImageService';

export default function DiscountForm({ workshopId, subvariantId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    discount_type: 'percentage',
    discount_value: '',
    promo_code: '',
    valid_from: '',
    valid_until: '',
    description: '',
    max_uses: '',
    max_uses_per_user: '',
    discount_bearer: 'WORKSHOP_OWNER',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        workshop_id: workshopId,
        subvariant_id: subvariantId
      };

      const response = await fetch(`${BASEURL}/crud/discounts/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Discount created successfully!');
        if (onSuccess) {
          setTimeout(() => onSuccess(data), 1500);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create discount');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating discount:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Create Discount
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Discount Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={formData.discount_type}
                onChange={(e) => handleChange('discount_type', e.target.value)}
                label="Discount Type"
                required
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                <MenuItem value="promo_code">Promo Code</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Discount Value */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Discount Value ${formData.discount_type === 'percentage' ? '(%)' : '(₹)'}`}
              type="number"
              value={formData.discount_value}
              onChange={(e) => handleChange('discount_value', e.target.value)}
              required
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>

          {/* Promo Code (only if discount_type is promo_code) */}
          {formData.discount_type === 'promo_code' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Promo Code"
                value={formData.promo_code}
                onChange={(e) => handleChange('promo_code', e.target.value.toUpperCase())}
                placeholder="e.g., EARLYBIRD20"
                helperText="Enter a unique promo code for users to apply"
              />
            </Grid>
          )}

          {/* Discount Bearer */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Who Bears the Discount Cost?</InputLabel>
              <Select
                value={formData.discount_bearer}
                onChange={(e) => handleChange('discount_bearer', e.target.value)}
                label="Who Bears the Discount Cost?"
                required
              >
                <MenuItem value="WORKSHOP_OWNER">Workshop Owner</MenuItem>
                <MenuItem value="NRITYA">Nritya Platform</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              {formData.discount_bearer === 'NRITYA' 
                ? '⚠️ Nritya will absorb the discount cost (Platform-sponsored)' 
                : 'Workshop owner will absorb the discount cost'}
            </Typography>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g., Early Bird 20% Off"
              multiline
              rows={2}
            />
          </Grid>

          {/* Valid From */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valid From"
              type="datetime-local"
              value={formData.valid_from}
              onChange={(e) => handleChange('valid_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Optional: When discount starts"
            />
          </Grid>

          {/* Valid Until */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valid Until"
              type="datetime-local"
              value={formData.valid_until}
              onChange={(e) => handleChange('valid_until', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Optional: When discount expires"
            />
          </Grid>

          {/* Max Uses */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Total Uses"
              type="number"
              value={formData.max_uses}
              onChange={(e) => handleChange('max_uses', e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Optional: Total times this can be used"
            />
          </Grid>

          {/* Max Uses Per User */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Uses Per User"
              type="number"
              value={formData.max_uses_per_user}
              onChange={(e) => handleChange('max_uses_per_user', e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Optional: Limit per user"
            />
          </Grid>

          {/* Is Active */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  color="primary"
                />
              }
              label="Active"
            />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Discount'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}


