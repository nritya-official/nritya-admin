import { useContext } from "react";
import {
  Button,
  Grid,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import dayOrder from "../../days.json";
import AuthContext from "../../context/AuthProvider";
import { TimePicker } from "@mui/x-date-pickers";

const StudioWeeklyTimings = ({ formData, setFormData }) => {
  const { darkMode } = useContext(AuthContext);
  const timings = formData.timings || {};

  const handleTimeChange = (day, index, type, newValue) => {
    const updatedDayTimings = [...(timings[day] || [])];
    updatedDayTimings[index][type] = dayjs(newValue).format("hh:mm A");

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

  return (
    <Grid container spacing={3}>
      {dayOrder.map((day) => (
        <Grid item xs={12} sm={6} md={4} key={day}>
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
                  labelPlacement="start"
                />
              </Box>
            </Box>

            {!isDayClosed(day) ? (
              (timings[day] || []).map((slot, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={5}>
                      <TimePicker
                        label="Start Time"
                        value={
                          slot.open === "Closed"
                            ? null
                            : dayjs(slot.open, "hh:mm A")
                        }
                        onChange={(newValue) =>
                          handleTimeChange(day, index, "open", newValue)
                        }
                        renderInput={(params) => (
                          <TextField {...params} size="small" fullWidth />
                        )}
                        timeSteps={{ minutes: 1 }}
                        views={["hours", "minutes"]}
                      />
                    </Grid>
                    <Grid item xs={5}>
                      <TimePicker
                        label="End Time"
                        value={
                          slot.close === "Closed"
                            ? null
                            : dayjs(slot.close, "hh:mm A")
                        }
                        onChange={(newValue) =>
                          handleTimeChange(day, index, "close", newValue)
                        }
                        renderInput={(params) => (
                          <TextField {...params} size="small" fullWidth />
                        )}
                        timeSteps={{ minutes: 1 }}
                        views={["hours", "minutes"]}
                      />
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
