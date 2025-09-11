import { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Grid,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import WorkshopForm from "../Components/workshop-crud/WorkshopForm";
import { BASEURL_PROD } from "../constants";

const WINDOWS = {
  DEFAULT: "default",
  ADD_WORKSHOP: "addWorkshop",
  UPDATE_WORKSHOP: "updateWorkshop",
};

// Mode URLs
const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
};

const render = {
  PRODUCTION: "https://www.nritya.co.in/",
  STAGING: "https://nritya-official.github.io/nritya-webApp/",
};

const initialData = {
  name: "",
  description: "",
  dance_styles: [],
  youtube_link: "",
  level: "",
  start_date: null,
  end_date: null,
  creator_email: "",
  venueType: "Studio", // Studio | Independent
  venueDetails: null, // Unified structure: { studio: "", address: "", buildingName: "", landmark: "", streetAddress: "", pincode: "", city: "", state: "", mapAddress: "", selectedLocation: "" }
  building: "",
  street: "",
  city: "",
  //state: "",
  //pincode: "",
  geolocation: "",
  mapAddress: "",
  variants: [
    {
      date: null,
      time: "",
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

// Utility function to format date
const formatDateToReadable = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (date.getTime() === 0 || isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Utility function to check draft status
const getDraftStatus = (creationTimeString) => {
  if (!creationTimeString) return { isDraftActive: false };
  
  const creationTime = new Date(creationTimeString * 1000);
  const currentTime = new Date();
  const timeDifference = currentTime - creationTime;
  const hoursDifference = timeDifference / (1000 * 60 * 60);
  return {
    isDraftActive: hoursDifference <= 24,
    hoursRemaining: Math.max(0, 24 - hoursDifference)
  };
};

function WorkshopCrud() {
  const [mode, setMode] = useState("STAGING");
  const [searchType, setSearchType] = useState("EMAIL");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [currentWindow, setCurrentWindow] = useState(WINDOWS.DEFAULT);
  const [isSubmited, setIsSubmited] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const baseUrlServer = server[mode];
  const baseUrlRender = render[mode];

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleSearch = async () => {
    let searchUrl = `${baseUrlServer}crud/get_workshops_by_creator/`;

    if (searchType === "EMAIL") {
      searchUrl += searchQuery;

      try {
        const response = await axios.get(
          `${baseUrlServer}crud/getUserDataByEmail/${searchQuery?.trim?.()}`
        );

        // Add logging for user details search
        console.log("=== USER DETAILS SEARCH DEBUG ===");
        console.log("User search URL:", `${baseUrlServer}crud/getUserDataByEmail/${searchQuery?.trim?.()}`);
        console.log("User search response:", response.data);
        console.log("User data:", response.data?.data);

        if (Object.keys(response.data?.data || {}).length) {
          setUserDetails(response.data?.data ?? null);
          console.log("User details set successfully:", response.data?.data);
        } else {
          setUserDetails(null);
          console.log("No user data found for email:", searchQuery);
          return alert("Failed to find user with the provided email");
        }
      } catch (error) {
        console.error("User search error:", error);
        setUserDetails(null);
        return alert("Failed to find user with the provided email");
      }
    } else if (searchType === "CITY") {
      // For city search, we'll need to implement a different endpoint
      setUserDetails(null);
      return alert("City search not implemented yet");
    }

    try {
      setSubmitting(true);
      setResults([]);
      const response = await axios.get(searchUrl);
      
      // Add comprehensive logging for debugging
      console.log("=== SEARCH API RESPONSE DEBUG ===");
      console.log("Search URL:", searchUrl);
      console.log("Full API Response:", response.data);
      console.log("Workshops array:", response.data.workshops);
      
      if (response.data.workshops && response.data.workshops.length > 0) {
        console.log("First workshop sample:", response.data.workshops[0]);
        console.log("Creator email fields in first workshop:", {
          creator_email: response.data.workshops[0].creator_email,
          creatorEmail: response.data.workshops[0].creatorEmail,
          allKeys: Object.keys(response.data.workshops[0])
        });
        
        console.log("Address fields in first workshop:", {
          building: response.data.workshops[0].building,
          street: response.data.workshops[0].street,
          city: response.data.workshops[0].city,
          //state: response.data.workshops[0].state,
          //pincode: response.data.workshops[0].pincode
        });
      }
      
      // Sort workshops by start date in descending order (newest first)
      const sortedWorkshops = (response.data.workshops || []).sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log("Workshops sorted by start date (newest first):", sortedWorkshops.map(w => ({
        name: w.name,
        start_date: w.start_date,
        formatted_date: formatDateToReadable(w.start_date)
      })));
      
      setResults(sortedWorkshops);
      setIsSubmited(true);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      setResults([]);
    } finally {
      setSubmitting(false);
    }
  };

  const addData = async () => {
    const transformedWorkshop = {
      name: formData.name,
      description: formData.description,
      dance_styles: formData.dance_styles.join(", "),
      youtube_link: formData.youtube_link || "",
      level: formData.level,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : "",
      end_date: formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : "",
      creator_email: formData?.creator_email,
      building: formData.building || "",
      street: formData.street || "",
      city: formData.city || "",
      //state: formData.state || "",
     // pincode: formData.pincode || "",
      geolocation: formData.geolocation || "",
      mapAddress: formData.mapAddress || "",
    };

    const transformedVariants = formData.variants.map((variant, index) => ({
      variant_id: `NEW_${index + 1}`,
      date: variant.date ? new Date(variant.date).toISOString().split('T')[0] : "",
      time: variant.time || "",
      description: variant.description || "",
      subvariants: variant.subvariants.map((sub, pIndex) => ({
        subvariant_id: `NEW_${index}_${pIndex + 1}`,
        price: sub.price || "",
        capacity: sub.capacity || "",
        description: sub.description || "",
      })),
    }));

    const payload = {
      workshop: transformedWorkshop,
      variants: transformedVariants,
    };

    try {
      const response = await fetch(`${baseUrlServer}crud/create_workshop/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Workshop added successfully!");
        return data;
      } else {
        alert("Failed to add. Check console for details.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const pushData = async (id, entityType) => {
    const transformedWorkshop = {
      name: formData.name,
      description: formData.description,
      dance_styles: formData.dance_styles.join(", "),
      youtube_link: formData.youtube_link || "",
      level: formData.level,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : "",
      end_date: formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : "",
      creator_email: formData.creator_email,
      building: formData.building || "",
      street: formData.street || "",
      city: formData.city || "",
      //state: formData.state || "",
      //pincode: formData.pincode || "",
      geolocation: formData.geolocation || "",
      mapAddress: formData.mapAddress || "",
    };
    console.log("AR_ transformedWorkshop {transformedWorkshop}", transformedWorkshop);
    const transformedVariants = formData.variants.map((variant, index) => ({
      variant_id: selectedWorkshop?.variants?.[index]?.variant_id || `NEW_${index + 1}`,
      date: variant.date ? new Date(variant.date).toISOString().split('T')[0] : "",
      time: variant.time || "",
      description: variant.description || "",
      subvariants: variant.subvariants.map((sub, pIndex) => ({
        subvariant_id: selectedWorkshop?.variants?.[index]?.subvariants?.[pIndex]?.subvariant_id || `NEW_${index}_${pIndex + 1}`,
        price: sub.price || "",
        capacity: sub.capacity || "",
        description: sub.description || "",
      })),
    }));

    const payload = {
      workshop: transformedWorkshop,
      variants: transformedVariants,
    };

    try {
      const response = await fetch(
        `${baseUrlServer}crud/update_workshop/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Workshop details updated successfully!");
      } else {
        console.error("Error pushing data:", data);
        alert("Failed to update. Check console for details.");
      }
    } catch (error) {
      console.error("Push Error:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleWorkshopClick = (workshop) => {
    setIsUpdating(true);
    setSelectedWorkshop(workshop);

    setFormData(() => {
      const formatedData = { ...workshop };

      // Add logging for form data mapping
      console.log("=== FORM DATA MAPPING DEBUG ===");
      console.log("Original workshop data:", workshop);
      console.log("Creator email fields before mapping:", {
        creator_email: formatedData.creator_email,
        creatorEmail: formatedData.creatorEmail
      });

      // Handle creator_email field mapping from API response (creatorEmail) to form field (creator_email)
      if (formatedData.creatorEmail && !formatedData.creator_email) {
        console.log("Mapping creatorEmail to creator_email:", formatedData.creatorEmail);
        formatedData.creator_email = formatedData.creatorEmail;
      }

      console.log("Creator email fields after mapping:", {
        creator_email: formatedData.creator_email,
        creatorEmail: formatedData.creatorEmail
      });

      // Add logging for address fields
      console.log("Address fields in workshop data:", {
        building: formatedData.building,
        street: formatedData.street,
        city: formatedData.city,
        //state: formatedData.state,
        //pincode: formatedData.pincode,
        venueDetails: formatedData.venueDetails
      });

      formatedData.dance_styles = formatedData.dance_styles
        ? formatedData.dance_styles.split(", ").filter(Boolean)
        : [];

      formatedData.variants = formatedData.variants || [
        {
          date: null,
          time: "",
          description: "",
          subvariants: [
            {
              price: "",
              capacity: "",
              description: "",
            },
          ],
        },
      ];

      return formatedData;
    });

    setCurrentWindow(WINDOWS.UPDATE_WORKSHOP);
  };

  const handleBack = () => {
    setCurrentWindow(WINDOWS.DEFAULT);
    setIsUpdating(false);
    setFormData(initialData);
    setSelectedWorkshop(null);
    setErrors({});
  };

  const handleSubmit = async (createWorkshopCallback) => {
    console.log("=== WORKSHOP CRUD HANDLE SUBMIT DEBUG ===");
    console.log("handleSubmit called, isUpdating:", isUpdating);
    console.log("createWorkshopCallback:", createWorkshopCallback);
    
    try {
      if (isUpdating) {
        console.log("Updating workshop...");
        setIsUpdating(false);
        await pushData(selectedWorkshop.workshop_id, "Workshop");
        setSelectedWorkshop(null);
      } else {
        console.log("Creating new workshop - calling callback if provided");
        // Workshop is already created by WorkshopForm.js, just call the callback if provided
        if (createWorkshopCallback) {
          await createWorkshopCallback();
        }
      }
    } finally {
      setFormData(initialData);
      setCurrentWindow(WINDOWS.DEFAULT);
      setErrors({});
      await handleSearch();
    }
  };

  const changeSearchMode = (e) => {
    setSearchType(e.target.value);
    setFormData(initialData);
    setCurrentWindow(WINDOWS.DEFAULT);
    setUserDetails(null);
    setResults([]);
    setSearchQuery("");
  };

  const handleDelete = async (workshop) => {
    if (!confirm(`Are you sure you want to delete "${workshop.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${baseUrlServer}crud/delete_workshop/${workshop.workshop_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Workshop deleted successfully");
        await handleSearch(); // Refresh the list
      } else {
        alert("Failed to delete workshop.");
      }
    } catch (error) {
      console.error("Error deleting workshop", error);
      alert("Failed to delete workshop.");
    }
  };

  return (
    <>
      {(currentWindow === WINDOWS.ADD_WORKSHOP ||
        currentWindow === WINDOWS.UPDATE_WORKSHOP) && (
        <WorkshopForm
          entityId={selectedWorkshop?.workshop_id}
          baseUrlServer={baseUrlServer}
          isUpdating={isUpdating}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      )}

      {currentWindow === WINDOWS.DEFAULT && (
        <>
          <Box
            sx={{
              p: 4,
              maxWidth: "100",
              margin: "auto",
              fontFamily: "sans-serif",
            }}
          >
            <Typography variant="h5" gutterBottom>
              Workshop CRUD
            </Typography>

            {/* Mode Select */}
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <FormControlLabel
                  value="STAGING"
                  control={<Radio />}
                  label="Staging"
                />
                <FormControlLabel
                  value="PRODUCTION"
                  control={<Radio />}
                  label="Production"
                />
              </RadioGroup>
            </FormControl>

            <br />

            {/* Search Type */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                row
                value={searchType}
                onChange={(e) => changeSearchMode(e)}
              >
                <FormControlLabel
                  value="EMAIL"
                  control={<Radio />}
                  label="Search by Email"
                />
                <FormControlLabel
                  value="CITY"
                  control={<Radio />}
                  label="Search by City"
                />
              </RadioGroup>
            </FormControl>

            <TextField
              label={`Enter ${searchType}`}
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{ mb: 2, width: "100%" }}
            />

            <Button
              variant="contained"
              color="primary"
              disabled={submitting}
              onClick={handleSearch}
              fullWidth
            >
              {submitting ? "Searching..." : "Search"}
            </Button>


              <Box sx={{ display: "flex", justifyContent: "end", mt: 2 }}>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setCurrentWindow(WINDOWS.ADD_WORKSHOP)}
                >
                  Add Workshop
                </Button>
              </Box>


            {results.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Workshop ID</b></TableCell>
                      <TableCell><b>Workshop Name</b></TableCell>
                      <TableCell><b>Creator Email</b></TableCell>
                      <TableCell><b>City</b></TableCell>
                      <TableCell><b>Dance Styles</b></TableCell>
                      <TableCell><b>Start Date</b></TableCell>
                      <TableCell><b>End Date</b></TableCell>
                      <TableCell><b>Actions</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((workshop, index) => {
                      // Add logging for each workshop row
                      console.log(`=== WORKSHOP ${index} TABLE DISPLAY DEBUG ===`);
                      console.log("Workshop data:", workshop);
                      console.log("Creator email values:", {
                        creator_email: workshop.creator_email,
                        creatorEmail: workshop.creatorEmail,
                        finalDisplayValue: workshop.creator_email || workshop.creatorEmail
                      });
                      
                      console.log("Address field values:", {
                        building: workshop.building,
                        street: workshop.street,
                        city: workshop.city,
                        //state: workshop.state,
                        //pincode: workshop.pincode
                      });
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <a
                              href={`${baseUrlRender}#/workshop/${workshop.workshop_id}`}
                              style={{ textDecoration: "none", color: "inherit" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {workshop.workshop_id}
                            </a>
                          </TableCell>
                          <TableCell>{workshop.name}</TableCell>
                          <TableCell>{workshop.creator_email || workshop.creatorEmail}</TableCell>
                        <TableCell>{workshop.city}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {workshop.dance_styles?.split(", ").map((style, i) => (
                              <Chip 
                                key={i} 
                                label={style.trim()} 
                                size="small" 
                                sx={{ 
                                  bgcolor: "#67569E",
                                  color: "white",
                                  textTransform: "capitalize",
                                  fontSize: "0.7rem"
                                }} 
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>{formatDateToReadable(workshop.start_date)}</TableCell>
                        <TableCell>{formatDateToReadable(workshop.end_date)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title={getDraftStatus(workshop.creation_time).isDraftActive ? "Edit workshop" : "Draft time expired"}>
                              <Button
                                variant="text"
                                size="small"
                                disabled={!getDraftStatus(workshop.creation_time).isDraftActive}
                                onClick={() => handleWorkshopClick(workshop)}
                                sx={{ 
                                  fontSize: "12px", 
                                  py: 0, 
                                  bgcolor: "#67569E",
                                  color: "white",
                                  textTransform: "capitalize",
                                  '&:hover': { 
                                    bgcolor: "#67569E", 
                                    color: "white"
                                  }, 
                                  '&:disabled': { color: 'lightgray' } 
                                }}
                              >
                                Edit
                              </Button>
                            </Tooltip>
                            <Tooltip title={getDraftStatus(workshop.creation_time).isDraftActive ? "Delete workshop" : "Draft time expired"}>
                              <Button
                                variant="text"
                                size="small"
                                disabled={!getDraftStatus(workshop.creation_time).isDraftActive}
                                onClick={() => handleDelete(workshop)}
                                sx={{ 
                                  fontSize: "12px", 
                                  py: 0, 
                                  bgcolor: "#dc3545",
                                  color: "white",
                                  textTransform: "capitalize",
                                  '&:hover': { 
                                    bgcolor: "#dc3545", 
                                    color: "white"
                                  }, 
                                  '&:disabled': { color: 'lightgray' } 
                                }}
                              >
                                Delete
                              </Button>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}
    </>
  );
}

export default WorkshopCrud;
