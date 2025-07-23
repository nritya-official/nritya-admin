import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import dayjs from "dayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  GoogleMap,
  Marker,
  Autocomplete as GoogleAutocomplete,
  LoadScriptNext,
} from "@react-google-maps/api";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import danceStyles from "../../danceStyles.json";
import cities from "../../cities.json";
import states from "../../states.json";
import StudioWeeklyTimings from "./StudioWeeklyTiming";
import ImageUpload from "../ImageUpload";

const danceStylesOptions = danceStyles.danceStyles;

const citiesOptions = cities.cities;
const statesOptions = states.states;

const amenitiesOptions = [
  "AC",
  "Free Wifi",
  "RO Water",
  "Toilet",
  "Power Backup",
  "Fire Extinguisher",
  "First Aid Kit",
  "CCTV Camera",
  "Card Payment",
  "Parking Space",
];

const classCategoryOptions = [
  "Kids",
  "Adults",
  "Women Only",
  "Men Only",
  "Seniors",
  "All Ages, Open to All",
  "Couples",
  "Families",
];

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

const libraries = ["places"];
const mapContainerStyle = {
  height: "400px",
  width: "100%",
};
const center = {
  lat: 20.5937,
  lng: 78.9629,
};

const TimeRangeModal = ({ open, onClose, value, onChange, index }) => {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  // Parse existing value when modal opens
  useEffect(() => {
    if (value) {
      const [startStr, endStr] = value.split(" - ");
      if (startStr && endStr) {
        const start = dayjs(startStr, "hh:mm A");
        const end = dayjs(endStr, "hh:mm A");
        setStartTime(start.isValid() ? start : null);
        setEndTime(end.isValid() ? end : null);
      }
    }
  }, [open, value]);

  const handleSave = () => {
    if (startTime && endTime) {
      const formattedRange = `${startTime.format("hh:mm A")} - ${endTime.format(
        "hh:mm A"
      )}`;
      onChange(index, "time", formattedRange);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Select Time Range</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2 }}>
            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
              ampm={true}
              timeSteps={{ minutes: 1 }}
              views={["hours", "minutes"]}
            />
            <Box>to</Box>
            <TimePicker
              label="End Time"
              value={endTime}
              onChange={setEndTime}
              ampm={true}
              timeSteps={{ minutes: 1 }}
              views={["hours", "minutes"]}
            />
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!startTime || !endTime}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AddStudio = ({
  entityId,
  baseUrlServer,
  isUpdating,
  formData,
  setFormData,
  errors,
  onSubmit,
  onBack,
}) => {
  const mapRef = useRef();
  const autocompleteRef = useRef();

  const studioImageRef = useRef();
  const logoImageRef = useRef();
  const announcementImageRef = useRef();

  const [mapCenter, setMapCenter] = useState(center);
  const [markerPosition, setMarkerPosition] = useState(null);

  const [timePickerModal, setTimePickerModal] = useState({
    open: false,
    index: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) {
        console.log("No geometry for the selected place");
        return;
      }

      const geolocation = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      const mapAddress = place.formatted_address;

      // Update form data
      setFormData((prev) => ({
        ...prev,
        mapAddress,
        geolocation,
      }));

      // Update map view
      setMapCenter(geolocation);
      setMarkerPosition(geolocation);
    }
  };

  const onMapClick = useCallback((e) => {
    // Get the clicked location
    const geolocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: geolocation }, (results, status) => {
      if (status === "OK" && results[0]) {
        const mapAddress = results[0].formatted_address;

        // Update form data
        setFormData((prev) => ({
          ...prev,
          mapAddress,
          geolocation,
        }));

        // Update marker
        setMarkerPosition({
          ...geolocation,
          mapAddress,
        });
      }
    });
  }, []);

  const handleAddressInputChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      mapAddress: value,
    }));
  };

  const handleAddressSubmit = () => {
    if (!formData.mapAddress) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: formData.mapAddress }, (results, status) => {
      if (status === "OK" && results[0]) {
        const geolocation = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };

        const mapAddress = results[0].formatted_address;

        // Update form data
        setFormData((prev) => ({
          ...prev,
          mapAddress,
          geolocation,
        }));

        // Update map view
        setMapCenter(geolocation);
        setMarkerPosition(geolocation);
      }
    });
  };

  const handleClassScheduleChange = (index, field, value) => {
    const updatedFormData = {
      ...formData,
      tableData: formData.tableData.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      ),
    };
    setFormData(updatedFormData);
  };

  const addClassSchedule = () => {
    const updatedFormData = {
      ...formData,
      tableData: [
        ...formData.tableData,
        {
          fee: "",
          freeTrial: "",
          className: "",
          time: "",
          days: [],
          danceForms: "",
          level: "",
          instructors: [],
          status: "",
          classCategory: [],
        },
      ],
    };
    setFormData(updatedFormData);
  };

  const removeClassSchedule = (index) => {
    const updatedFormData = {
      ...formData,
      tableData: formData.tableData.filter((_, i) => i !== index),
    };
    setFormData(updatedFormData);
  };

  const openTimePicker = (index) => {
    setTimePickerModal({
      open: true,
      index,
    });
  };

  const closeTimePicker = () => {
    setTimePickerModal({
      open: false,
      index: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (entityId) {
      try {
        await Promise.allSettled([
          studioImageRef.current.uploadImages(),
          logoImageRef.current.uploadImages(),
          announcementImageRef.current.uploadImages(),
        ]);
      } catch (error) {
        console.error("Image upload failed:", error);
      }
      await onSubmit();
    } else {
      await onSubmit(async (newlyCreatedEntityId) => {
        try {
          await Promise.allSettled([
            studioImageRef.current.uploadImages(newlyCreatedEntityId),
            logoImageRef.current.uploadImages(newlyCreatedEntityId),
            announcementImageRef.current.uploadImages(newlyCreatedEntityId),
          ]);
        } catch (error) {
          console.error("Image upload failed:", error);
        }
      });
    }
  };

  return (
    <Box sx={{ px: 3 }}>
      <Button variant="text" color="primary" onClick={onBack}>
        Go Back
      </Button>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box component="form" onSubmit={handleSubmit} sx={{ my: 3 }}>
          <Typography variant="h4" gutterBottom>
            {!isUpdating ? "Add New Studio" : "Update Studio"}
          </Typography>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Studio Name
                </Typography>
                <TextField
                  fullWidth
                  name="studioName"
                  value={formData.studioName}
                  onChange={handleInputChange}
                  error={errors?.studioName}
                  helperText={errors?.studioName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Founder's Name
                </Typography>
                <TextField
                  fullWidth
                  name="founderName"
                  value={formData.founderName}
                  onChange={handleInputChange}
                  error={errors?.founderName}
                  helperText={errors?.founderName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  About Studio
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="aboutStudio"
                  value={formData.aboutStudio}
                  onChange={handleInputChange}
                  error={errors?.aboutStudio}
                  helperText={errors?.aboutStudio}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  About Founder
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="aboutFounder"
                  value={formData.aboutFounder}
                  onChange={handleInputChange}
                  error={errors?.aboutFounder}
                  helperText={errors?.aboutFounder}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Mobile Number
                </Typography>
                <TextField
                  fullWidth
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  error={errors?.mobileNumber}
                  helperText={errors?.mobileNumber}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  name="mailAddress"
                  value={formData.mailAddress}
                  onChange={handleInputChange}
                  error={errors?.mailAddress}
                  helperText={errors?.mailAddress}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Whatsapp Number
                </Typography>
                <TextField
                  fullWidth
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                  error={errors?.whatsappNumber}
                  helperText={errors?.whatsappNumber}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Studio Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Dance Styles
                </Typography>
                <FormControl fullWidth error={!!errors?.danceStyles}>
                  <Autocomplete
                    multiple
                    options={danceStylesOptions}
                    value={formData.danceStyles}
                    onChange={(event, newValue) => {
                      handleMultiSelectChange("danceStyles", newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!errors?.danceStyles}
                        helperText={errors?.danceStyles}
                      />
                    )}
                    renderTags={(selected, getTagProps) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value, index) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            {...getTagProps({ index })}
                          />
                        ))}
                      </Box>
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <ListItemText primary={option} />
                      </li>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Maximum Occupancy
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  name="maximumOccupancy"
                  value={formData.maximumOccupancy}
                  onChange={handleInputChange}
                  error={errors?.maximumOccupancy}
                  helperText={errors?.maximumOccupancy}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Number of Hall(s)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  name="numberOfHalls"
                  value={formData.numberOfHalls}
                  onChange={handleInputChange}
                  error={errors?.numberOfHalls}
                  helperText={errors?.numberOfHalls}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Address Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Building Name
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  name="buildingName"
                  value={formData.buildingName}
                  onChange={handleInputChange}
                  error={errors?.buildingName}
                  helperText={errors?.buildingName}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Landmark
                </Typography>
                <TextField
                  fullWidth
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  error={errors?.landmark}
                  helperText={errors?.landmark}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Street
                </Typography>
                <TextField
                  fullWidth
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  error={errors?.street}
                  helperText={errors?.street}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  Pincode
                </Typography>
                <TextField
                  fullWidth
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  error={errors?.pincode}
                  helperText={errors?.pincode}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  City
                </Typography>
                <FormControl fullWidth error={errors?.city}>
                  <Select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  >
                    {citiesOptions.map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors?.city}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  State
                </Typography>
                <FormControl fullWidth error={errors?.state}>
                  <Select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  >
                    {statesOptions.map((state) => (
                      <MenuItem key={state} value={state}>
                        <ListItemText primary={state} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors?.state}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Location on Map
                </Typography>

                <LoadScriptNext
                  googleMapsApiKey="AIzaSyAAPq5IMotbu90TZAEtyj8qgYyVJoROzsQ"
                  libraries={libraries}
                >
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <GoogleAutocomplete
                        onLoad={(autocomplete) => {
                          autocompleteRef.current = autocomplete;
                        }}
                        onPlaceChanged={onPlaceChanged}
                        className="w-full"
                      >
                        <TextField
                          fullWidth
                          value={formData.mapAddress}
                          onChange={handleAddressInputChange}
                          error={errors?.mapAddress}
                          helperText={errors?.mapAddress}
                        />
                      </GoogleAutocomplete>
                      <Button
                        variant="contained"
                        onClick={handleAddressSubmit}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Find on Map
                      </Button>
                    </Box>

                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={12}
                      onLoad={onMapLoad}
                      onClick={onMapClick}
                    >
                      {markerPosition && (
                        <Marker
                          position={{
                            lat: markerPosition.lat,
                            lng: markerPosition.lng,
                          }}
                        />
                      )}
                    </GoogleMap>
                  </Box>
                </LoadScriptNext>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Additional Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  GST Number
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  error={errors?.gstNumber}
                  helperText={errors?.gstNumber}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Add Amenities
                </Typography>
                <FormControl fullWidth error={errors?.addAmenities}>
                  <Select
                    multiple
                    value={formData.addAmenities}
                    onChange={(e) =>
                      handleMultiSelectChange("addAmenities", e.target.value)
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {amenitiesOptions.map((amenity) => (
                      <MenuItem key={amenity} value={amenity}>
                        <ListItemText primary={amenity} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors?.addAmenities}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Enrollment Process
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  name="enrollmentProcess"
                  value={formData.enrollmentProcess}
                  onChange={handleInputChange}
                  error={errors?.enrollmentProcess}
                  helperText={errors?.enrollmentProcess}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Time Table Of dance classes
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {formData.tableData.map((schedule, index) => (
              <Box
                key={index}
                sx={{ mb: 3, p: 2, border: "1px solid #ddd", borderRadius: 1 }}
              >
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <Typography variant="subtitle1">
                    Class #{index + 1}
                  </Typography>

                  <IconButton
                    onClick={() => removeClassSchedule(index)}
                    disabled={formData.tableData.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Class Name
                    </Typography>
                    <TextField
                      fullWidth
                      value={schedule.className}
                      onChange={(e) =>
                        handleClassScheduleChange(
                          index,
                          "className",
                          e.target.value
                        )
                      }
                      error={errors.tableData?.[index]?.className}
                      helperText={errors.tableData?.[index]?.className}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Dance Form
                    </Typography>
                    <FormControl
                      fullWidth
                      error={errors.tableData?.[index]?.danceForms}
                    >
                      <Autocomplete
                        options={danceStylesOptions}
                        value={schedule.danceForms}
                        onChange={(event, newValue) =>
                          handleClassScheduleChange(
                            index,
                            "danceForms",
                            newValue
                          )
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={!!errors.tableData?.[index]?.danceForms}
                            helperText={errors.tableData?.[index]?.danceForms}
                          />
                        )}
                        renderOption={(props, option) => (
                          <MenuItem {...props}>{option}</MenuItem>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Days
                    </Typography>

                    <FormControl
                      fullWidth
                      error={errors.tableData?.[index]?.days}
                    >
                      <Select
                        multiple
                        value={schedule.days}
                        onChange={(e) =>
                          handleClassScheduleChange(
                            index,
                            "days",
                            e.target.value
                          )
                        }
                        renderValue={(selected) => selected.join(", ")}
                      >
                        {daysOfWeek.map((day) => (
                          <MenuItem key={day} value={day}>
                            <Checkbox
                              checked={schedule.days.indexOf(day) > -1}
                            />
                            <ListItemText primary={day} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Time
                    </Typography>
                    <TextField
                      fullWidth
                      value={schedule.time}
                      onClick={() => openTimePicker(index)}
                      InputProps={{
                        readOnly: true,
                      }}
                      error={errors.tableData?.[index]?.time}
                      helperText={errors.tableData?.[index]?.time || ""}
                    />
                    <TimeRangeModal
                      open={timePickerModal.open}
                      onClose={closeTimePicker}
                      value={
                        timePickerModal.index !== null
                          ? formData.tableData[timePickerModal.index]?.time
                          : ""
                      }
                      onChange={handleClassScheduleChange}
                      index={timePickerModal.index}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Instructors
                    </Typography>
                    <FormControl
                      fullWidth
                      error={errors.tableData?.[index]?.instructors}
                    >
                      <TextField
                        value={schedule.instructors}
                        onChange={(e) =>
                          handleClassScheduleChange(
                            index,
                            "instructors",
                            e.target.value
                          )
                        }
                        error={errors.tableData?.[index]?.instructors}
                        helperText={errors.tableData?.[index]?.instructors}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Fee (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={schedule.fee}
                      onChange={(e) =>
                        handleClassScheduleChange(index, "fee", e.target.value)
                      }
                      error={errors.tableData?.[index]?.fee}
                      helperText={errors.tableData?.[index]?.fee}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Level
                    </Typography>
                    <FormControl
                      fullWidth
                      error={errors.tableData?.[index]?.level}
                    >
                      <Select
                        value={schedule.level}
                        onChange={(e) =>
                          handleClassScheduleChange(
                            index,
                            "level",
                            e.target.value
                          )
                        }
                      >
                        {["Beginner", "Intermediate", "Advanced", "Misc"].map(
                          (level) => (
                            <MenuItem key={level} value={level}>
                              {level}
                            </MenuItem>
                          )
                        )}
                      </Select>
                      <FormHelperText>
                        {errors.tableData?.[index]?.level}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Free Trial
                    </Typography>
                    <FormControl
                      fullWidth
                      error={errors.tableData?.[index]?.freeTrial}
                    >
                      <Select
                        value={schedule.freeTrial}
                        onChange={(e) =>
                          handleClassScheduleChange(
                            index,
                            "freeTrial",
                            e.target.value
                          )
                        }
                      >
                        {["true", "false"].map((freeTrial) => (
                          <MenuItem key={freeTrial} value={freeTrial}>
                            {freeTrial}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {errors.tableData?.[index]?.freeTrial}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1" gutterBottom>
                      Class Category
                    </Typography>
                    <FormControl
                      fullWidth
                      error={errors.tableData?.[index]?.classCategory}
                    >
                      <Select
                        value={schedule.classCategory}
                        onChange={(e) =>
                          handleClassScheduleChange(
                            index,
                            "classCategory",
                            e.target.value
                          )
                        }
                      >
                        {classCategoryOptions.map((classCategory) => (
                          <MenuItem key={classCategory} value={classCategory}>
                            {classCategory}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {errors.tableData?.[index]?.classCategory}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addClassSchedule}
              sx={{ mt: 2 }}
            >
              Add Another Class
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Studio Timings
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <StudioWeeklyTimings
              formData={formData}
              setFormData={setFormData}
            />
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Social Media Links
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Instagram
                </Typography>
                <TextField
                  fullWidth
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  error={errors?.instagram}
                  helperText={errors?.instagram}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Facebook
                </Typography>
                <TextField
                  fullWidth
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  error={errors?.facebook}
                  helperText={errors?.facebook}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  YouTube
                </Typography>
                <TextField
                  fullWidth
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleInputChange}
                  error={errors?.youtube}
                  helperText={errors?.youtube}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  Twitter
                </Typography>
                <TextField
                  fullWidth
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  error={errors?.twitter}
                  helperText={errors?.twitter}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Studio Images
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <ImageUpload
              ref={studioImageRef}
              imageType="studio"
              baseApiUrl={baseUrlServer}
              entityId={entityId}
              title="Upload Studio Images"
              min={1}
              max={10}
            />
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Logo Image
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <ImageUpload
              ref={logoImageRef}
              imageType="logo"
              baseApiUrl={baseUrlServer}
              entityId={entityId}
              title="Upload Logo"
              min={1}
              max={1}
              isCropRequired
            />
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Announcement Images
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <ImageUpload
              ref={announcementImageRef}
              imageType="announcements"
              baseApiUrl={baseUrlServer}
              entityId={entityId}
              title="Upload Announcement Images"
              min={1}
              max={5}
            />
          </Paper>

          <Box sx={{ textAlign: "right" }}>
            <Button variant="contained" type="submit">
              Submit
            </Button>
          </Box>
        </Box>
      </LocalizationProvider>
    </Box>
  );
};

export default AddStudio;
