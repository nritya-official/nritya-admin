import { useContext } from "react";
import {
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Paper,
} from "@mui/material";
import dayOrder from "../../days.json";
import AuthContext from "../../context/AuthProvider";

const generateTimeOptions = () => {
  let option_AM = [];
  let option_PM = [];
  for (let hours = 0; hours < 24; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 15) {
      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      const timeString = `${formattedHours}:${formattedMinutes}`;

      if (hours < 12) {
        option_AM.push(`${timeString} AM`);
      } else {
        const formattedHours12 = (hours === 12 ? 12 : hours - 12)
          .toString()
          .padStart(2, "0");
        option_PM.push(`${formattedHours12}:${formattedMinutes} PM`);
      }
    }
  }

  return [...option_AM, ...option_PM];
};

const StudioWeeklyTimings = ({ formData, setFormData }) => {
  const { darkMode } = useContext(AuthContext);
  const timings = formData.timings || {};

  const handleSelect = (day, index, type, value) => {
    const updatedDayTimings = [...(timings[day] || [])];
    updatedDayTimings[index][type] = value;

    setFormData({
      ...formData,
      timings: {
        ...timings,
        [day]: updatedDayTimings,
      },
    });
  };

  const addTimeSlot = (day) => {
    const dayTimings = timings[day] || [];
    const updatedDayTimings = [
      ...dayTimings,
      { open: "09:00 AM", close: "06:00 PM" },
    ];

    setFormData({
      ...formData,
      timings: {
        ...timings,
        [day]: updatedDayTimings,
      },
    });
  };

  const removeTimeSlot = (day, index) => {
    const dayTimings = timings[day] || [];
    if (dayTimings.length <= 1) return;

    const updatedDayTimings = [...dayTimings];
    updatedDayTimings.splice(index, 1);

    setFormData({
      ...formData,
      timings: {
        ...timings,
        [day]: updatedDayTimings,
      },
    });
  };

  const toggleDayClosed = (day) => {
    const dayTimings = timings[day] || [];
    const isClosed = dayTimings.length === 1 && dayTimings[0].open === "Closed";

    setFormData({
      ...formData,
      timings: {
        ...timings,
        [day]: isClosed
          ? [{ open: "09:00 AM", close: "06:00 PM" }]
          : [{ open: "Closed", close: "Closed" }],
      },
    });
  };

  const isDayClosed = (day) => {
    const dayTimings = timings[day] || [];
    return dayTimings.length === 1 && dayTimings[0].open === "Closed";
  };

  const timeOptions = generateTimeOptions();

  return (
    <Grid container spacing={3}>
      {dayOrder.map((day) => (
        <Grid item xs={12} sm={6} md={4} xl={3} key={day}>
          <Box sx={{ p: 2, border: "1px solid #ddd", borderRadius: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="caption"
                  color={darkMode ? "text.secondary" : "text.primary"}
                >
                  {isDayClosed(day) ? "Closed" : "Open"}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDayClosed(day)}
                      onChange={() => toggleDayClosed(day)}
                      color={darkMode ? "default" : "primary"}
                    />
                  }
                  label=""
                  labelPlacement="start"
                />
              </Box>
            </Box>

            {!isDayClosed(day) ? (
              (timings[day] || []).map((slot, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Start Time</InputLabel>
                        <Select
                          value={slot.open}
                          onChange={(e) =>
                            handleSelect(day, index, "open", e.target.value)
                          }
                          label="Start Time"
                        >
                          {timeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>End Time</InputLabel>
                        <Select
                          value={slot.close}
                          onChange={(e) =>
                            handleSelect(day, index, "close", e.target.value)
                          }
                          label="End Time"
                        >
                          {timeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2}>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => removeTimeSlot(day, index)}
                        disabled={(timings[day] || []).length <= 1}
                        sx={{ minWidth: "auto", height: "40px" }}
                      >
                        -
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Studio is closed on this day
              </Typography>
            )}

            {!isDayClosed(day) && (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => addTimeSlot(day)}
              >
                Add Time Slot
              </Button>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default StudioWeeklyTimings;
