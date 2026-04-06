import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Grid,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import {
  CloseOutlined,
  Delete,
} from "@mui/icons-material";
import { BASEURL_PROD } from "../../constants";
import axios from "axios";

const DAYS_OF_WEEK = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const initialData = {
  class_name: "",
  start_date: "",
  end_date: "",
  time: "",
  days: [],
  category: "",
  level: 0,
  dance_form: [],
  instructor_name: "",
  instructor_ig_handle: "",
  photo_link: "",
  studio_id: "",
  free_trial: false,
  drop_in_price: 0,
  fee: 0,
  per_month: false,
  per_x_session: null,
  creator_email: "",
  subvariants: [
    {
      price: "",
      capacity: "",
      description: "",
    },
  ],
};

export default function ClassForm({ existingClass = null, userId, userEmail, onClose }) {
  const [formData, setFormData] = useState(initialData);
  const [studios, setStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStudios = async () => {
      if (!userEmail) {
        console.log("No user email found");
        return;
      }

      try {
        setLoadingStudios(true);
        const response = await axios.get(
          `${BASEURL_PROD}crud/listStudiosWithFilters/?creatorEmail=${encodeURIComponent(userEmail)}`
        );

        if (response.data?.data) {
          setStudios(response.data.data || []);
          console.log("Studios loaded:", response.data.data);
        } else {
          console.error("Failed to fetch studios");
        }
      } catch (error) {
        console.error("Error fetching studios:", error);
      } finally {
        setLoadingStudios(false);
      }
    };

    fetchStudios();
  }, [userEmail]);

  useEffect(() => {
    if (existingClass) {
      setFormData({
        class_name: existingClass.class_name || "",
        start_date: existingClass.start_date || "",
        end_date: existingClass.end_date || "",
        time: existingClass.time || "",
        days: existingClass.days || [],
        category: existingClass.category || "",
        level: existingClass.level || 0,
        dance_form: existingClass.dance_form || [],
        instructor_name: existingClass.instructor_name || "",
        instructor_ig_handle: existingClass.instructor_ig_handle || "",
        photo_link: existingClass.photo_link || "",
        studio_id: existingClass.studio_id || "",
        free_trial: existingClass.free_trial || false,
        drop_in_price: existingClass.drop_in_price || 0,
        fee: existingClass.fee || 0,
        per_month: existingClass.per_month || false,
        per_x_session: existingClass.per_x_session || null,
        creator_email: existingClass.creator_email || userEmail,
        subvariants: existingClass.subvariants && existingClass.subvariants.length > 0
          ? existingClass.subvariants.map((sv) => ({
              subvariant_id: sv.subvariant_id,
              price: sv.price,
              capacity: sv.capacity,
              description: sv.description || "",
            }))
          : [{
              price: existingClass.fee || 0,
              capacity: 10,
              description: "",
            }],
      });
    } else {
      setFormData({
        ...initialData,
        creator_email: userEmail || "",
      });
    }
  }, [existingClass, userEmail]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.class_name || !formData.studio_id || !formData.fee) {
      alert("Please fill in all required fields (Class Name, Studio, Fee)");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        class: {
          class_name: formData.class_name,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          time: formData.time,
          days: formData.days,
          category: formData.category,
          level: formData.level,
          dance_form: formData.dance_form,
          instructor_name: formData.instructor_name,
          instructor_ig_handle: formData.instructor_ig_handle,
          photo_link: formData.photo_link,
          studio_id: formData.studio_id,
          free_trial: formData.free_trial,
          drop_in_price: formData.drop_in_price || 0,
          fee: formData.fee || 0,
          per_month: formData.per_month,
          per_x_session: formData.per_x_session || null,
          creator_email: formData.creator_email || userEmail,
          user_id: userId,
        },
        subvariants: formData.subvariants.map((sv) => ({
          subvariant_id: sv.subvariant_id || (existingClass ? "NEW_1" : undefined),
          price: sv.price || formData.fee,
          capacity: sv.capacity || 10,
          description: sv.description || "",
        })),
      };

      let response;
      if (existingClass) {
        response = await axios.put(
          `${BASEURL_PROD}crud/update_class/${existingClass.class_id}`,
          payload
        );
      } else {
        response = await axios.post(`${BASEURL_PROD}crud/create_class/`, payload);
      }

      if (response.status === 200 || response.status === 201) {
        alert(`Class ${existingClass ? 'updated' : 'created'} successfully!`);
        onClose();
      }
    } catch (error) {
      console.error(`Error ${existingClass ? 'updating' : 'creating'} class:`, error);
      alert(`Failed to ${existingClass ? 'update' : 'create'} class: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "black",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "30px",
          }}
        >
          {existingClass ? "Edit Class" : "Add New Class"}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseOutlined />
        </IconButton>
      </Box>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Class Name"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Studio</InputLabel>
                <Select
                  name="studio_id"
                  value={formData.studio_id}
                  onChange={handleChange}
                  label="Studio"
                  required
                  disabled={loadingStudios}
                >
                  {loadingStudios ? (
                    <MenuItem value="">Loading studios...</MenuItem>
                  ) : (
                    studios.map((studio) => (
                      <MenuItem key={studio.id} value={studio.id}>
                        {studio.studioName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="e.g., 10:00 AM - 11:00 AM"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Days of Week</InputLabel>
                <Select
                  multiple
                  name="days"
                  value={formData.days}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      days: e.target.value,
                    }));
                  }}
                  renderValue={(selected) => 
                    selected.map(val => DAYS_OF_WEEK.find(d => d.value === val)?.label).join(", ")
                  }
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      <Checkbox checked={formData.days.indexOf(day.value) > -1} />
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Level"
                name="level"
                value={formData.level}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dance Forms (comma-separated)"
                value={formData.dance_form.join(", ")}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    dance_form: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                  }));
                }}
                placeholder="e.g., Bharatanatyam, Kathak"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Instructor Name"
                name="instructor_name"
                value={formData.instructor_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Instructor IG Handle"
                name="instructor_ig_handle"
                value={formData.instructor_ig_handle}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Photo Link"
                name="photo_link"
                value={formData.photo_link}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Fee"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Drop-in Price"
                name="drop_in_price"
                value={formData.drop_in_price}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="free_trial"
                    checked={formData.free_trial}
                    onChange={handleChange}
                  />
                }
                label="Free Trial Available"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="per_month"
                    checked={formData.per_month}
                    onChange={handleChange}
                  />
                }
                label="Per Month"
              />
            </Grid>

            {!formData.per_month && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Per X Sessions"
                  name="per_x_session"
                  value={formData.per_x_session || ""}
                  onChange={handleChange}
                  placeholder="4, 8, or 12"
                />
              </Grid>
            )}

            {/* Subvariants */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Subvariants
              </Typography>
              {formData.subvariants.map((sv, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Price"
                        value={sv.price}
                        onChange={(e) => {
                          const newSubvariants = [...formData.subvariants];
                          newSubvariants[index].price = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, subvariants: newSubvariants });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Capacity"
                        value={sv.capacity}
                        onChange={(e) => {
                          const newSubvariants = [...formData.subvariants];
                          newSubvariants[index].capacity = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, subvariants: newSubvariants });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={sv.description}
                        onChange={(e) => {
                          const newSubvariants = [...formData.subvariants];
                          newSubvariants[index].description = e.target.value;
                          setFormData({ ...formData, subvariants: newSubvariants });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: "#67569E",
                    color: "white",
                    textTransform: "capitalize",
                    "&:hover": { bgcolor: "#67569E", color: "white" },
                  }}
                >
                  {isSubmitting ? "Saving..." : existingClass ? "Update Class" : "Create Class"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}







