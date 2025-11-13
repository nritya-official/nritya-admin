import React from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const FORM_FIELD_HEIGHT = 56;

// Helper function to format time to HH:mm:ss (ensure seconds are present)
const formatTimeToHHMMSS = (timeStr) => {
  if (!timeStr) return null;
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      // Add seconds if not present
      return `${parts[0]}:${parts[1]}:00`;
    } else if (parts.length === 3) {
      // Keep existing format with seconds
      return timeStr;
    }
  }
  return timeStr;
};

const WorkshopStep2EventInfo = ({
  onBack,
  onSubmit,
  formData,
  setFormData,
  isSubmitting,
}) => {
  // Parse existing time data when editing
  React.useEffect(() => {
    if (formData.variants) {
      const updatedVariants = formData.variants.map(variant => {
        if (variant.time && !variant.startTime && !variant.endTime) {
          // Parse existing time format (e.g., "09:00:00-17:00:00" or "09:00-17:00")
          const timeParts = variant.time.split('-');
          if (timeParts.length === 2) {
            const startTime = timeParts[0].trim();
            const endTime = timeParts[1].trim();
            
            return {
              ...variant,
              startTime: formatTimeToHHMMSS(startTime),
              endTime: formatTimeToHHMMSS(endTime)
            };
          }
        }
        return variant;
      });
      
      // Only update if there were changes
      const hasChanges = updatedVariants.some((variant, index) => 
        variant.startTime !== formData.variants[index].startTime || 
        variant.endTime !== formData.variants[index].endTime
      );
      
      if (hasChanges) {
        setFormData(prev => ({ ...prev, variants: updatedVariants }));
      }
    }
  }, [formData.variants, setFormData]);
  const handleVariantChange = (index, field) => (e) => {
    const value = e?.target?.value ?? e;
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleSubvariantChange = (variantIndex, subvariantIndex, field) => (e) => {
    const value =
      e?.target?.type === "checkbox"
        ? e.target.checked
        : e?.target?.value ?? e;
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].subvariants[subvariantIndex][field] = value;
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          date: null,
          startTime: null,
          endTime: null,
          time: "", // Keep for backward compatibility
          description: "",
          subvariants: [
            {
              price: "",
              capacity: "",
              description: "",
              is_time_sensitive: false,
              time_sensitive_date: null,
              time_sensitive_time: null,
            },
          ],
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    const updatedVariants = [...formData.variants];
    updatedVariants.splice(index, 1);
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const addSubvariant = (variantIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].subvariants.push({
      price: "",
      capacity: "",
      description: "",
      is_time_sensitive: false,
      time_sensitive_date: null,
      time_sensitive_time: null,
    });
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const removeSubvariant = (variantIndex, subvariantIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].subvariants.splice(subvariantIndex, 1);
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography
          variant="h6"
          sx={{
            color: "black",
            textTransform: "capitalize",
          }}
          gutterBottom
        >
          Event Schedule & Pricing
        </Typography>
      </Grid>

      {formData.variants.map((variant, variantIndex) => (
        <React.Fragment key={variantIndex}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: "16px",
                  color: "black",
                }}
              >
                Event {variantIndex + 1}
              </Typography>
              {formData.variants.length > 1 && (
                <IconButton
                  onClick={() => removeVariant(variantIndex)}
                  sx={{ color: "black" }}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            <Paper
              elevation={2}
              sx={{
                mb: 3,
                p: 3,
                borderRadius: 2,
                bgcolor: "unset",
              }}
            >
              <Grid container rowSpacing={3} columnSpacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "16px",
                      color: "black",
                    }}
                    gutterBottom
                  >
                    Date
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      name="date"
                      sx={{ width: "100%" }}
                      value={variant.date ? dayjs(variant.date) : null}
                      onChange={handleVariantChange(variantIndex, "date")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "16px",
                      color: "black",
                    }}
                    gutterBottom
                  >
                    Start Time
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      name="startTime"
                      sx={{ width: "100%" }}
                      value={variant.startTime ? dayjs(variant.startTime, 'HH:mm:ss') : null}
                      onChange={(time) => {
                        const updatedVariants = [...formData.variants];
                        updatedVariants[variantIndex].startTime = time ? time.format('HH:mm:ss') : null;
                        setFormData((prev) => ({ ...prev, variants: updatedVariants }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "16px",
                      color: "black",
                    }}
                    gutterBottom
                  >
                    End Time
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      name="endTime"
                      sx={{ width: "100%" }}
                      value={variant.endTime ? dayjs(variant.endTime, 'HH:mm:ss') : null}
                      onChange={(time) => {
                        const updatedVariants = [...formData.variants];
                        updatedVariants[variantIndex].endTime = time ? time.format('HH:mm:ss') : null;
                        setFormData((prev) => ({ ...prev, variants: updatedVariants }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "16px",
                      color: "black",
                    }}
                    gutterBottom
                  >
                    Event Description
                  </Typography>
                  <TextField
                    fullWidth
                    name="description"
                    value={variant.description}
                    onChange={handleVariantChange(variantIndex, "description")}
                    sx={{ height: FORM_FIELD_HEIGHT }}
                    variant="outlined"
                    InputLabelProps={{ shrink: false }}
                    placeholder="Description"
                  />
                </Grid>

                {/* Display combined time range */}
                {variant.startTime && variant.endTime && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#f5f5f5",
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        Time Range: {variant.startTime} - {variant.endTime}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Pricing Options
                    </Typography>
                    <Button
                      onClick={() => addSubvariant(variantIndex)}
                      startIcon={<AddIcon />}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    >
                      Add Pricing
                    </Button>
                  </Box>

                  {variant.subvariants.map((subvariant, subvariantIndex) => (
                    <Box key={subvariantIndex} sx={{border: "1px solid #E0E0E0", borderRadius: "8px", p: 2, mb: 2}}>
                    <Grid
                      key={subvariantIndex}
                      container
                      rowSpacing={3}
                      columnSpacing={2}
                      sx={{
                        mb:
                          subvariantIndex !== variant.subvariants.length - 1
                            ? 2
                            : 0,
                      }}
                    >
                      <Grid item xs={12} sm={3}>
                        <Typography
                          variant="body1"
                          sx={{ fontSize: "16px" }}
                          gutterBottom
                        >
                          Price
                        </Typography>
                        <TextField
                          fullWidth
                          name="price"
                          value={subvariant.price}
                          onChange={handleSubvariantChange(
                            variantIndex,
                            subvariantIndex,
                            "price"
                          )}
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder="Enter price"
                          type="number"
                        />
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Typography
                          variant="body1"
                          sx={{ fontSize: "16px" }}
                          gutterBottom
                        >
                          Capacity
                        </Typography>
                        <TextField
                          fullWidth
                          name="capacity"
                          value={subvariant.capacity}
                          onChange={handleSubvariantChange(
                            variantIndex,
                            subvariantIndex,
                            "capacity"
                          )}
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder="Enter capacity"
                          type="number"
                        />
                      </Grid>

                      <Grid item xs={12} sm={5}>
                        <Typography
                          variant="body1"
                          sx={{ fontSize: "16px" }}
                          gutterBottom
                        >
                          Description
                        </Typography>
                        <TextField
                          fullWidth
                          name="description"
                          value={subvariant.description}
                          onChange={handleSubvariantChange(
                            variantIndex,
                            subvariantIndex,
                            "description"
                          )}
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder="Description"
                        />
                      </Grid>

                      <Grid
                        item
                        xs={12}
                        sm={1}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {variant.subvariants.length > 1 && (
                          <IconButton
                            onClick={() =>
                              removeSubvariant(variantIndex, subvariantIndex)
                            }
                            sx={{ color: "black" }}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!subvariant.is_time_sensitive}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                const updatedVariants = [...formData.variants];
                                const targetSubvariant =
                                  updatedVariants[variantIndex].subvariants[
                                    subvariantIndex
                                  ];
                                targetSubvariant.is_time_sensitive = checked;
                                if (!checked) {
                                  targetSubvariant.time_sensitive_date = null;
                                  targetSubvariant.time_sensitive_time = null;
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: updatedVariants,
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Time Sensitive"
                        />
                      </Grid>

                      {subvariant.is_time_sensitive && (
                        <>
                          <Grid item xs={12} sm={3}>
                            <Typography
                              variant="body1"
                              sx={{ fontSize: "16px" }}
                              gutterBottom
                            >
                              Specific Date
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                sx={{ width: "100%" }}
                                value={
                                  subvariant.time_sensitive_date
                                    ? dayjs(subvariant.time_sensitive_date)
                                    : null
                                }
                                onChange={(newValue) => {
                                  const updatedVariants = [
                                    ...formData.variants,
                                  ];
                                  updatedVariants[variantIndex].subvariants[
                                    subvariantIndex
                                  ].time_sensitive_date = newValue
                                    ? newValue.format("YYYY-MM-DD")
                                    : null;
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: updatedVariants,
                                  }));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    sx={{ height: FORM_FIELD_HEIGHT }}
                                    variant="outlined"
                                  />
                                )}
                              />
                            </LocalizationProvider>
                          </Grid>

                          <Grid item xs={12} sm={3}>
                            <Typography
                              variant="body1"
                              sx={{ fontSize: "16px" }}
                              gutterBottom
                            >
                              Specific Time
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <TimePicker
                                sx={{ width: "100%" }}
                                value={
                                  subvariant.time_sensitive_time
                                    ? dayjs(
                                        subvariant.time_sensitive_time,
                                        "HH:mm:ss"
                                      )
                                    : null
                                }
                                onChange={(newValue) => {
                                  const updatedVariants = [
                                    ...formData.variants,
                                  ];
                                  updatedVariants[variantIndex].subvariants[
                                    subvariantIndex
                                  ].time_sensitive_time = newValue
                                    ? newValue.format("HH:mm:ss")
                                    : null;
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: updatedVariants,
                                  }));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    sx={{ height: FORM_FIELD_HEIGHT }}
                                    variant="outlined"
                                  />
                                )}
                              />
                            </LocalizationProvider>
                          </Grid>
                        </>
                      )}
                    </Grid>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </React.Fragment>
      ))}

      <Grid item xs={12} sx={{ pb: 2 }}>
        <Button
          size="small"
          onClick={addVariant}
          startIcon={<AddIcon />}
          sx={{ textTransform: "capitalize" }}
        >
          Add Another Event
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="contained"
            type="button"
            sx={{
              bgcolor: "#67569E",
              color: "white",
              textTransform: "capitalize",
              "&:hover": { bgcolor: "#67569E", color: "white" },
            }}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            type="button"
            disabled={isSubmitting}
            sx={{
              bgcolor: "#67569E",
              color: "white",
              textTransform: "capitalize",
              "&:hover": { bgcolor: "#67569E", color: "white" },
            }}
            onClick={onSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Workshop"}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default WorkshopStep2EventInfo;