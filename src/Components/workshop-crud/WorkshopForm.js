import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Grid,
  MenuItem,
  Container,
  Button as MuiButton,
  FormControl,
  ButtonGroup,
  Select,
  Autocomplete,
  Stack,
} from "@mui/material";
import {
  Add,
  CloseOutlined,
  Close,
  Delete,
  CloudUpload,
  YouTube,
  Image,
  Upload,
} from "@mui/icons-material";
import { BASEURL_PROD } from "../../constants";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import dayjs from "dayjs";
import { Form } from "react-bootstrap";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import WorkshopStep2EventInfo from "./WorkshopStep2EventInfo";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Header from "../Header";
import danceStylesData from "../../danceStyles.json";
import citiesData from "../../cities.json";
import statesData from "../../states.json";

const FORM_FIELD_HEIGHT = 56;

// Dance styles fetched from JSON file
const danceStylesOptions = danceStylesData.danceStyles;

// Cities fetched from JSON file
const cityOptions = citiesData.cities;

// States fetched from JSON file
const stateOptions = statesData.states;

// Updated LEVELS to use numbers mapped to strings
const LEVELS = {
  1: "Beginner",
  2: "Intermediate", 
  3: "Advanced",
  0: "All Levels"
};

const initialValue = {
  name: "",
  description: "",
  dance_styles: [],
  youtube_link: "",
  level: "",
  start_date: null,
  end_date: null,
  creator_email: "",
  venueType: "Studio", // Studio | Independent
  studioAssociation: null,
  // Venue fields moved to top level
  studio: "",
  building: "",
  street: "",
  city: "",
  state: "",
  landmark: "",
  mapAddress: "",
  geolocation: "",
  variants: [
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
        },
      ],
    },
  ],
};

const theme = createTheme({
  typography: {
    fontFamily: '"Nunito Sans", sans-serif',
  },
});

const WorkshopForm = ({ 
  entityId, 
  baseUrlServer, 
  isUpdating, 
  formData, 
  setFormData, 
  errors, 
  onBack, 
  onSubmit 
}) => {
  const [step, setStep] = useState(1);
  const hasInitializedStudio = useRef(false);

  // Add logging to see what formData is received
  useEffect(() => {
    console.log("=== WORKSHOP FORM RECEIVED DATA DEBUG ===");
    console.log("isUpdating:", isUpdating);
    console.log("Full formData received:", formData);
    console.log("Address fields in formData:", {
      building: formData?.building,
      street: formData?.street,
      city: formData?.city,
      state: formData?.state,
      pincode: formData?.pincode,
      venueDetails: formData?.venueDetails
    });
  }, [formData, isUpdating]);

  // Fetch workshop icon when editing
  useEffect(() => {
    const fetchWorkshopIcon = async () => {
      if (isUpdating && entityId) {
        try {
          console.log("Fetching workshop icon for entityId:", entityId);
          const response = await fetch(`${baseUrlServer}imagesCrud/workshopIcon/${entityId}/`);
          if (response.ok) {
            const result = await response.json();
            console.log("Workshop icon response:", result);
            if (result.image_urls && result.image_urls.length > 0) {
              setWorkshopIconUrl(result.image_urls[0]);
              console.log("Workshop icon URL set:", result.image_urls[0]);
            }
          } else {
            console.log("No workshop icon found or error fetching icon");
          }
        } catch (error) {
          console.error('Error fetching workshop icon:', error);
        }
      }
    };

    fetchWorkshopIcon();
  }, [isUpdating, entityId, baseUrlServer]);
  const [isVideoLink, setIsVideoLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workshopIconUrl, setWorkshopIconUrl] = useState("");
  const [studios, setStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(false);
  const [isCreatorEmailValid, setIsCreatorEmailValid] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Handle JSON import
  const handleImportJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        console.log("Imported JSON data:", jsonData);
        
        // Map JSON data to formData structure
        const importedFormData = {
          name: jsonData.name || "",
          description: jsonData.description || "",
          dance_styles: jsonData.dance_styles ? jsonData.dance_styles.split(", ") : [],
          youtube_link: jsonData.youtube_link || "",
          level: jsonData.level || 0,
          start_date: jsonData.start_date || "",
          end_date: jsonData.end_date || "",
          building: jsonData.building || "",
          street: jsonData.street || "",
          city: jsonData.city || "",
          landmark: jsonData.landmark || "",
          geolocation: jsonData.geolocation || "",
          map_address: jsonData.map_address || "",
          // Map variants
          variants: jsonData.variants ? jsonData.variants.map(variant => ({
            variant_id: variant.variant_id || "",
            date: variant.date || "",
            startTime: variant.time ? variant.time.split('-')[0] : "",
            endTime: variant.time ? variant.time.split('-')[1] : "",
            description: variant.description || "",
            subvariants: variant.subvariants ? variant.subvariants.map(sub => ({
              subvariant_id: sub.subvariant_id || "",
              price: sub.price || 0,
              capacity: sub.capacity || 0,
              description: sub.description || "",
              current_bookings: sub.current_bookings || 0
            })) : []
          })) : []
        };

        // Update formData with imported data
        setFormData(prev => ({
          ...prev,
          ...importedFormData
        }));

        alert("Workshop data imported successfully!");
        
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Error importing JSON file. Please check the file format.");
      }
    };
    
    reader.readAsText(file);
    setImportFile(file);
  };

  // Initialize studio association and video link only once when editing
  useEffect(() => {
    if (isUpdating && formData && formData.studio_association && !hasInitializedStudio.current) {
      // If editing existing workshop, check if it has a video link
      if (formData.youtube_link) {
        setIsVideoLink(true);
      }
      
      // Handle studioAssociation for existing workshops
      const studioId = formData.studio_association.split('-')[0];
      setFormData((prev) => ({
        ...prev,
        studio: studioId,
        venueType: "Studio",
      }));
      
      hasInitializedStudio.current = true; // Mark as initialized to prevent re-runs
    }
  }, [isUpdating, formData, setFormData]);

  // Handle studio selection when studios are loaded and we have a studioAssociation
  useEffect(() => {
    if (studios.length > 0 && formData.studio && isUpdating) {
      const selectedStudio = studios.find(studio => studio.id === formData.studio);
      
      if (selectedStudio) {
        setFormData((prev) => ({
          ...prev,
          building: selectedStudio.buildingName || "",
          street: selectedStudio.street || "",
          city: selectedStudio.city || "",
          state: selectedStudio.state || "",
          landmark: selectedStudio.landmark || "",
          mapAddress: selectedStudio.mapAddress || "",
          geolocation: selectedStudio.geolocation && selectedStudio.geolocation.lat && selectedStudio.geolocation.lng ? 
            `${selectedStudio.geolocation.lat},${selectedStudio.geolocation.lng}` : null,
        }));
      }
    }
  }, [studios, formData.studio, isUpdating]);

  useEffect(() => {
    const validateCreatorEmailAndFetchStudios = async () => {
      if (!formData.creator_email) {
        setIsCreatorEmailValid(false);
        setStudios([]);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.creator_email)) {
        setIsCreatorEmailValid(false);
        setStudios([]);
        return;
      }

      try {
        setLoadingStudios(true);
        
        // First validate if user exists
        const userResponse = await fetch(
          `${baseUrlServer}crud/getUserDataByEmail/${encodeURIComponent(formData.creator_email)}`
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.data && Object.keys(userData.data).length > 0) {
            setIsCreatorEmailValid(true);
            
            // Now fetch studios for this creator
            const studiosResponse = await fetch(
              `${baseUrlServer}crud/listStudiosWithFilters/?creatorEmail=${encodeURIComponent(formData.creator_email)}`
            );

            if (studiosResponse.ok) {
              const studiosData = await studiosResponse.json();
              setStudios(studiosData.data || []);
              console.log("Studios loaded:", studiosData.data);
            } else {
              console.error("Failed to fetch studios:", studiosResponse.statusText);
              setStudios([]);
            }
          } else {
            setIsCreatorEmailValid(false);
            setStudios([]);
          }
        } else {
          setIsCreatorEmailValid(false);
          setStudios([]);
        }
      } catch (error) {
        console.error("Error validating creator email or fetching studios:", error);
        setIsCreatorEmailValid(false);
        setStudios([]);
      } finally {
        setLoadingStudios(false);
      }
    };

    validateCreatorEmailAndFetchStudios();
  }, [formData.creator_email, baseUrlServer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, workshopImage: file }));
      const imageUrl = URL.createObjectURL(file);
      setWorkshopIconUrl(imageUrl);
    }
  };

  const handleDateChange = (name) => (date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleVenueTypeChange = (e) => {
    const venueType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      venueType,
      // Reset venue fields when changing venue type
      studio: "",
      building: "",
      street: "",
      city: "",
      state: "",
      landmark: "",
      mapAddress: "",
      geolocation: "",
      studioAssociation: null,
    }));
  };

  const handleStudioChange = (e) => {
    const studioId = e.target.value;
    const selectedStudio = studios.find(
      (studioIdItem) => studioIdItem?.id === studioId
    );

    if (selectedStudio) {
      setFormData((prev) => ({
        ...prev,
        studio: studioId,
        building: selectedStudio.buildingName || "",
        street: selectedStudio.street || "",
        city: selectedStudio.city || "",
        state: selectedStudio.state || "",
        landmark: selectedStudio.landmark || "",
        mapAddress: selectedStudio.mapAddress || "",
        geolocation: selectedStudio.geolocation && selectedStudio.geolocation.lat && selectedStudio.geolocation.lng ? 
          `${selectedStudio.geolocation.lat},${selectedStudio.geolocation.lng}` : null,
        studioAssociation: `${studioId}-${selectedStudio.studioName}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        studio: "",
        building: "",
        street: "",
        city: "",
        state: "",
        landmark: "",
        mapAddress: "",
        geolocation: "",
        studioAssociation: null,
      }));
    }
  };

  const handleIndependentVenueChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isValidInputs = () => {
    if (step === 1) {
      if (
        !formData.name ||
        !formData.creator_email ||
        !formData.description ||
        !formData.dance_styles?.length ||
        (!formData && formData.level !== "") ||
        //!formData.venueType ||
        !formData.start_date ||
        !formData.end_date
      ) {
        return false;
      }

      // Check venue-specific fields
      if (formData.venueType === "Studio") {
        if (!formData.studio || !formData.building || !formData.street || !formData.city) {
          return false;
        }
      } else if (formData.venueType === "Independent") {
        if (!formData.building || !formData.street || !formData.city) {
          return false;
        }
      }

      if (!isVideoLink) {
        if (!formData.workshopImage && !isUpdating) {
          return false;
        }
      } else {
        if (!formData.youtube_link) {
          return false;
        }
      }

      return true;
    } else {
      if (!formData.variants?.length) {
        return false;
      }

      for (const variant of formData.variants) {
        if (
          !variant.date ||
          !variant.startTime ||
          !variant.endTime ||
          !variant.description ||
          !variant.subvariants?.length
        ) {
          return false;
        }

        for (const subvariant of variant.subvariants) {
          if (!subvariant.price || !subvariant.capacity || !subvariant.description) {
            return false;
          }
        }
      }

      return true;
    }
  };

  const gotoStep2 = async (event) => {
    event.preventDefault();

    if (!isValidInputs()) {
      alert("Please fill all the fields.");
      return;
    }

    setStep((prev) => prev + 1);
  };

  const clearForm = () => {
    setFormData(initialValue);
    setIsVideoLink(false);
  };

  const handleAddWorkshop = async (event) => {
    event.preventDefault();
    
    console.log("=== WORKSHOP CREATION DEBUG ===");
    console.log("handleAddWorkshop called, isUpdating:", isUpdating);
    console.log("Event:", event);

    if (!isValidInputs()) {
      alert("Please fill all the fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log(formData);
      const transformedWorkshop = {
        name: formData.name,
        description: formData.description,
        dance_styles: formData.dance_styles.join(", "),
        youtube_link: formData.youtube_link || "",
        level: formData.level,
        start_date: formData.start_date
          ? dayjs(formData.start_date).format("YYYY-MM-DD")
          : "",
        end_date: formData.end_date
          ? dayjs(formData.end_date).format("YYYY-MM-DD")
          : "",
        creator_email: formData.creator_email || formData.creatorEmail,
        studio_association: formData.studioAssociation,
        // Venue fields moved to top level
        building: formData.building || "",
        street: formData.street || "",
        city: formData.city || "",
        landmark: formData.landmark || "",
        geolocation: formData.geolocation || "",
        map_address: formData.mapAddress || "",
      };
      const transformedVariants = formData.variants.map((variant, index) => ({
        // Use existing variant_id when updating, generate NEW only when creating
        variant_id: variant.variant_id || `NEW_${index + 1}`,
        date: variant.date ? dayjs(variant.date).format("YYYY-MM-DD") : "",
        time: variant.startTime && variant.endTime ? `${variant.startTime}-${variant.endTime}` : "",
        description: variant.description,
        subvariants: variant.subvariants.map((sub, pIndex) => ({
          // Use existing subvariant_id when updating, generate NEW only when creating
          subvariant_id: sub.subvariant_id || `NEW_${index}_${pIndex + 1}`,
          price: sub.price,
          capacity: sub.capacity,
          description: sub.description,
        })),
      }));

      const payload = {
        workshop: transformedWorkshop,
        variants: transformedVariants,
      };

      let response;
      let workshopId;
      console.log("AR_ payload", payload , "v/s", formData);

      if (isUpdating) {
        response = await fetch(
          `${baseUrlServer}crud/update_workshop/${entityId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
        workshopId = entityId;
      } else {
        response = await fetch(`${baseUrlServer}crud/create_workshop/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();

        if (!isUpdating && result.workshop_id) {
          workshopId = result.workshop_id;
        }

        if (formData.workshopImage && workshopId) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("images", formData.workshopImage);
            formDataUpload.append("entity_id", workshopId);

            const iconResponse = await fetch(
              `${baseUrlServer}imagesCrud/workshopIcon/`,
              {
                method: "POST",
                body: formDataUpload,
              }
            );

            if (iconResponse.ok) {
              alert(
                isUpdating
                  ? "Workshop and image updated successfully!"
                  : "Workshop and image created successfully!"
              );
            } else {
              alert(
                "Workshop saved but image upload failed. You can upload the image later."
              );
            }
          } catch (iconError) {
            console.error("Error uploading workshop image:", iconError);
            alert(
              "Workshop saved but image upload failed. You can upload the image later."
            );
          }
        } else {
          alert(
            isUpdating
              ? "Workshop successfully updated."
              : "Workshop successfully added."
          );
        }

        console.log("Workshop created successfully, calling onSubmit callback");
        clearForm();
        onSubmit();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to save workshop");
      }
    } catch (error) {
      console.error("Error saving workshop:", error);
      alert(error?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Container component="main" className="flex-grow-1">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                my: 3,
                color: "black",
                fontFamily: "Nunito Sans",
                textTransform: "none",
                fontWeight: 500,
                letterSpacing: 0.5,
                fontSize: "30px",
              }}
            >
              {isUpdating ? "Edit Workshop" : "Add New Workshop"}
            </Typography>
            <IconButton onClick={onBack}>
              <CloseOutlined />
            </IconButton>
          </Box>

          {/* Import JSON Section */}
          {!isUpdating && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                border: "1px dashed #ccc",
                borderRadius: 2,
                backgroundColor: "#f9f9f9",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Upload color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Import workshop data from exported JSON file:
                </Typography>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  style={{ display: "none" }}
                  id="import-json-input"
                />
                <label htmlFor="import-json-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                    size="small"
                    sx={{ textTransform: "none" }}
                  >
                    Choose JSON File
                  </Button>
                </label>
                {importFile && (
                  <Typography variant="caption" color="success.main">
                    ✓ {importFile.name}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          <Paper
            elevation={2}
            sx={{
              my: 3,
              p: 3,
              borderRadius: 2,
              bgcolor: "unset",
            }}
          >
            {step === 1 && (
              <Form id="addWorkshopForm" onSubmit={gotoStep2}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "black",
                    textTransform: "capitalize",
                  }}
                  gutterBottom
                >
                  Workshop Info
                </Typography>

                <Grid container rowSpacing={3} columnSpacing={2}>
                  <Grid item xs={12}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Creator Email
                    </Typography>
                    <TextField
                      fullWidth
                      name="creator_email"
                      type="email"
                      sx={{ height: FORM_FIELD_HEIGHT }}
                      variant="outlined"
                      InputLabelProps={{ shrink: false }}
                      placeholder="Enter creator email"
                      value={formData.creator_email|| formData.creatorEmail}
                      onChange={handleChange}
                    />
                    {(formData.creator_email || formData.creatorEmail) && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {loadingStudios ? (
                          <>
                            <Typography variant="body2" color="info.main">
                              Validating email and loading studios...
                            </Typography>
                          </>
                        ) : isCreatorEmailValid ? (
                          <>
                            <Typography variant="body2" color="success.main">
                              ✓ Email validated. {studios.length} studio(s) found.
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" color="error.main">
                              ✗ Invalid email or user not found.
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Workshop Name
                    </Typography>
                    <TextField
                      fullWidth
                      name="name"
                      sx={{ height: FORM_FIELD_HEIGHT }}
                      variant="outlined"
                      InputLabelProps={{ shrink: false }}
                      placeholder="Enter workshop name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isCreatorEmailValid}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Description
                    </Typography>
                    <ReactQuill
                      theme="snow"
                      placeholder="Enter Description"
                      value={formData.description}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          description: value,
                        }));
                      }}
                      readOnly={!isCreatorEmailValid}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontSize: "16px" }}
                        gutterBottom
                      >
                        Workshop Media
                      </Typography>
                      <Box sx={{ display: "flex" }}>
                        <ButtonGroup>
                          <Button
                            size="small"
                            variant={!isVideoLink ? "contained" : "outlined"}
                            onClick={() => setIsVideoLink(false)}
                            startIcon={<Image />}
                            disabled={!isCreatorEmailValid}
                            sx={{
                              textTransform: "capitalize",
                              ...(!isVideoLink && {
                                bgcolor: "#67569E",
                                color: "white",
                                "&:hover": {
                                  bgcolor: "#67569E",
                                  color: "white",
                                },
                              }),
                              ...(isVideoLink && {
                                color: "text.primary",
                                borderColor: "divider",
                                "&:hover": {
                                  bgcolor: "action.hover",
                                  borderColor: "divider",
                                },
                              }),
                            }}
                          >
                            Upload Image
                          </Button>
                          <Button
                            size="small"
                            variant={isVideoLink ? "contained" : "outlined"}
                            onClick={() => setIsVideoLink(true)}
                            startIcon={<YouTube />}
                            disabled={!isCreatorEmailValid}
                            sx={{
                              textTransform: "capitalize",
                              ...(isVideoLink && {
                                bgcolor: "#67569E",
                                color: "white",
                                "&:hover": {
                                  bgcolor: "#67569E",
                                  color: "white",
                                },
                              }),
                              ...(!isVideoLink && {
                                color: "text.primary",
                                borderColor: "divider",
                                "&:hover": {
                                  bgcolor: "action.hover",
                                  borderColor: "divider",
                                },
                              }),
                            }}
                          >
                            YouTube Link
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </Box>

                    {!isVideoLink ? (
                      <Box>
                        <Button
                          fullWidth
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUpload sx={{ fontSize: 20 }} />}
                          disabled={!isCreatorEmailValid}
                          sx={{
                            height: FORM_FIELD_HEIGHT,
                            color: "black",
                            borderColor: "#0000003b",
                            "&:hover": {
                              borderColor: "#0000003b",
                            },
                          }}
                        >
                          Upload Workshop Image
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            name="workshopImage"
                            onChange={handleImageUpload}
                            disabled={!isCreatorEmailValid}
                          />
                        </Button>
                        {formData?.workshopImage && (
                          <Box
                            sx={{
                              fontSize: 12,
                              marginTop: 1,
                              color: "black",
                            }}
                          >
                            Selected file: {formData?.workshopImage?.name}
                          </Box>
                        )}
                        {workshopIconUrl && (
                          <Box
                            sx={{
                              position: "relative",
                              display: "inline-block",
                              marginTop: 2,
                              border: "1px solid #e0e0e0",
                              borderRadius: 1,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              component="img"
                              src={workshopIconUrl}
                              alt="Workshop preview"
                              sx={{
                                width: "100%",
                                maxWidth: 300,
                                height: "auto",
                                display: "block",
                              }}
                            />
                            <IconButton
                              onClick={() => setWorkshopIconUrl("")}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: "red",
                                color: "white",
                                width: 24,
                                height: 24,
                                "&:hover": {
                                  bgcolor: "darkred",
                                  color: "white",
                                },
                              }}
                            >
                              <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        name="youtube_link"
                        value={formData.youtube_link || ""}
                        onChange={handleChange}
                        sx={{ height: FORM_FIELD_HEIGHT }}
                        variant="outlined"
                        InputLabelProps={{ shrink: false }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        disabled={!isCreatorEmailValid}
                      />
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Dance Styles
                    </Typography>
                    <Autocomplete
                      multiple
                      id="tags-standard"
                      options={danceStylesOptions}
                      value={formData.dance_styles}
                      onChange={(_, value) => {
                        setFormData((prev) => ({
                          ...prev,
                          dance_styles: value,
                        }));
                      }}
                      disabled={!isCreatorEmailValid}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          placeholder="Select Dance Styles"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Level
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        displayEmpty
                        disabled={!isCreatorEmailValid}
                        sx={{ height: FORM_FIELD_HEIGHT }}
                      >
                        <MenuItem value="">Select level</MenuItem>
                        {Object.entries(LEVELS).map(([key, value]) => (
                          <MenuItem key={key} value={key}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Venue Type
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        name="venueType"
                        value={formData.venueType || ""}
                        onChange={handleVenueTypeChange}
                        displayEmpty
                        disabled={!isCreatorEmailValid}
                        sx={{ height: FORM_FIELD_HEIGHT }}
                      >
                        <MenuItem value="Studio">Studio address</MenuItem>
                        <MenuItem value="Independent">
                          Independent location
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      Start Date
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={formData.start_date ? dayjs(formData.start_date) : null}
                        onChange={(date) => handleDateChange("start_date")(date)}
                        disabled={!isCreatorEmailValid}
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
                      sx={{
                        fontSize: "16px",
                        color: "black",
                      }}
                      gutterBottom
                    >
                      End Date
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={formData.end_date ? dayjs(formData.end_date) : null}
                        onChange={(date) => handleDateChange("end_date")(date)}
                        minDate={formData.start_date ? dayjs(formData.start_date) : null}
                        disabled={!isCreatorEmailValid}
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

                  {formData.venueType === "Studio" && (
                    <Grid item xs={12}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "16px",
                          color: "black",
                        }}
                        gutterBottom
                      >
                        Select Studio Address
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          name="studio"
                          value={formData.studio || ""}
                          onChange={handleStudioChange}
                          displayEmpty
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          disabled={loadingStudios || !isCreatorEmailValid}
                        >
                          <MenuItem value="">
                            {loadingStudios 
                              ? "Loading studios..." 
                              : studios.length === 0 
                                ? "No studios found for this creator" 
                                : "Select studio address"}
                          </MenuItem>
                          {studios.map((studio, index) => {
                            const studioAddress = `${
                              studio.buildingName
                                ? studio.buildingName + ", "
                                : ""
                            }${studio.street}, ${studio.city}, ${
                              studio.state
                            }, ${studio.country} - ${studio.pincode}`;

                            return (
                              <MenuItem key={index} value={studio?.id || ""}>
                                {studio?.studioName} - {studioAddress}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      {formData.studio && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="success.main">
                            ✓ Studio details loaded below
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  )}

                  {/* Show address fields when editing or when studio is selected */}
                  {(isUpdating || (formData.venueType === "Studio" && formData.studio)) && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "16px",
                            color: "black",
                          }}
                          gutterBottom
                        >
                          Building Name
                        </Typography>
                        <TextField
                          fullWidth
                          name="building"
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder={isUpdating ? "Building name" : "Building name from selected studio"}
                          value={formData.building}
                          disabled={!isUpdating}
                          onChange={isUpdating ? handleChange : undefined}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "16px",
                            color: "black",
                          }}
                          gutterBottom
                        >
                          Street Address
                        </Typography>
                        <TextField
                          fullWidth
                          name="street"
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder={isUpdating ? "Street address" : "Street address from selected studio"}
                          value={formData.street}
                          disabled={!isUpdating}
                          onChange={isUpdating ? handleChange : undefined}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "16px",
                            color: "black",
                          }}
                          gutterBottom
                        >
                          City
                        </Typography>
                        <TextField
                          fullWidth
                          name="city"
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder={isUpdating ? "City" : "City from selected studio"}
                          value={formData.city}
                          disabled={!isUpdating}
                          onChange={isUpdating ? handleChange : undefined}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "16px",
                            color: "black",
                          }}
                          gutterBottom
                        >
                          State
                        </Typography>
                        <TextField
                          fullWidth
                          name="state"
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder={isUpdating ? "State" : "State from selected studio"}
                          value={formData.state}
                          disabled={!isUpdating}
                          onChange={isUpdating ? handleChange : undefined}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "16px",
                            color: "black",
                          }}
                          gutterBottom
                        >
                          Landmark (Optional)
                        </Typography>
                        <TextField
                          fullWidth
                          name="landmark"
                          sx={{ height: FORM_FIELD_HEIGHT }}
                          variant="outlined"
                          InputLabelProps={{ shrink: false }}
                          placeholder={isUpdating ? "Enter landmark (optional)" : "Landmark from selected studio"}
                          value={formData.landmark}
                          disabled={!isUpdating}
                          onChange={isUpdating ? handleChange : undefined}
                        />
                      </Grid>

                      {formData.geolocation && (
                        <Grid item xs={12}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: "16px",
                              color: "black",
                            }}
                            gutterBottom
                          >
                            Geolocation (Lat, Lng)
                          </Typography>
                          <TextField
                            fullWidth
                            sx={{ height: FORM_FIELD_HEIGHT }}
                            variant="outlined"
                            InputLabelProps={{ shrink: false }}
                            placeholder="Geolocation from selected studio"
                            value={formData.geolocation}
                            disabled={true}
                          />
                        </Grid>
                      )}
                    </>
                  )}

                  <Grid item xs={12} sx={{ textAlign: "right" }}>
                    <MuiButton
                      variant="contained"
                      type="submit"
                      disabled={isSubmitting}
                      sx={{
                        bgcolor: "#67569E",
                        color: "white",
                        textTransform: "capitalize",
                        "&:hover": { bgcolor: "#67569E", color: "white" },
                      }}
                    >
                      Next
                    </MuiButton>
                  </Grid>
                </Grid>
              </Form>
            )}

            {step === 2 && (
              <WorkshopStep2EventInfo
                onBack={() => setStep((prev) => prev - 1)}
                onSubmit={handleAddWorkshop}
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
              />
            )}
          </Paper>
        </Container>
      </div>
    </ThemeProvider>
  );
};

export default WorkshopForm;