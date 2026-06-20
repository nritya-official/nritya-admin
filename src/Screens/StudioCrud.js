import { useState, useMemo } from "react";
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
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Autocomplete,
} from "@mui/material";
import {
  Search as SearchIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  ViewList as ListIcon,
} from "@mui/icons-material";
import axios from "axios";
import AddStudio from "../Components/studio-crud/AddStudio";
import AdminEntityMap, { parseGeo } from "../Components/AdminEntityMap";
import { updateDaysFormat } from "../utils/mapping";
import citiesData from "../cities.json";

const STUDIO_ICON = "https://cdn.jsdelivr.net/gh/nritya-official/nritya@main/dance_studio.webp";

const WINDOWS = {
  DEFAULT: "default",
  ADD_STUDIO: "addStudio",
  UPDATE_STUDIO: "updateStudio",
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
  studioName: "",
  founderName: "",
  aboutStudio: "",
  aboutFounder: "",

  mobileNumber: "",
  mailAddress: "",
  whatsappNumber: "",

  danceStyles: [],
  maximumOccupancy: "",
  numberOfHalls: "",

  buildingName: "",
  landmark: "",
  street: "",
  pincode: "",
  city: "",
  state: "",
  country: "India",
  mapAddress: "",
  geolocation: {
    lat: null,
    lng: null,
  },

  gstNumber: "",
  addAmenities: [],
  enrollmentProcess: "",

  tableData: [
    {
      fee: "",
      freeTrial: "",
      className: "",
      time: "",
      days: [],
      danceForms: "",
      level: "",
      instructors: "",
      status: "",
      classCategory: [],
    },
  ],

  timings: {
    tuesday: [{ open: "09:00 AM", close: "06:00 PM" }],
    wednesday: [{ open: "09:00 AM", close: "06:00 PM" }],
    thursday: [{ open: "09:00 AM", close: "06:00 PM" }],
    friday: [{ open: "09:00 AM", close: "06:00 PM" }],
    saturday: [{ open: "09:00 AM", close: "06:00 PM" }],
    sunday: [{ open: "09:00 AM", close: "06:00 PM" }],
    monday: [{ open: "09:00 AM", close: "06:00 PM" }],
  },

  instagram: "",
  facebook: "",
  youtube: "",
  twitter: "",
};

function StudioCrud() {
  const [mode, setMode] = useState("STAGING");
  const [searchType, setSearchType] = useState("EMAIL");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [currentWindow, setCurrentWindow] = useState(WINDOWS.DEFAULT);
  const [isSubmited, setIsSubmited] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [resultView, setResultView] = useState("list"); // 'list' | 'map'

  const baseUrlServer = server[mode];
  const baseUrlRender = render[mode];

  const mapItems = useMemo(
    () =>
      (results || [])
        .map((studio) => {
          const geo = parseGeo(studio.geolocation);
          if (!geo) return null;
          return {
            key: studio.id,
            geo,
            name: studio.studioName || "Unnamed Studio",
            image: studio.iconUrl || STUDIO_ICON,
            addressLine: [studio.street, studio.city].filter(Boolean).join(", "),
            meta: studio.creatorEmail || "",
            badge: studio.status || null,
            viewUrl: `${baseUrlRender}#/studio/${studio.id}`,
            ctaLabel: "Edit",
            _raw: studio,
          };
        })
        .filter(Boolean),
    [results, baseUrlRender]
  );

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleSearch = async () => {
    let searchUrl = `${baseUrlServer}crud/listStudiosWithFilters/`;

    if (searchType === "EMAIL") {
      searchUrl += `?creatorEmail=${searchQuery}`;

      try {
        const response = await axios.get(
          `${baseUrlServer}crud/getUserDataByEmail/${searchQuery?.trim?.()}`
        );

        if (Object.keys(response.data?.data || {}).length) {
          setUserDetails(response.data?.data ?? null);
        } else {
          setUserDetails(null);
          return alert("Failed to find user with the provided email");
        }
      } catch (error) {
        console.error(error);
        setUserDetails(null);
        return alert("Failed to find user with the provided email");
      }
    } else if (searchType === "CITY") {
      searchUrl += `?city=${searchQuery}`;
      setUserDetails(null);
    }

    try {
      setSubmitting(true);
      setResults([]);
      const response = await axios.get(searchUrl);
      setResults(response.data.data || []); // assuming response.data.data holds the array
      setIsSubmited(true);
    } catch (error) {
      console.error("Error fetching studios:", error);
      setResults([]);
    } finally {
      setSubmitting(false);
    }
  };

  const addData = async () => {
    const formatedData = {
      ...formData,
      danceStyles: formData.danceStyles.join(","),
      addAmenities: formData.addAmenities.join(","),
      tableData: formData.tableData.reduce((acc, item, index) => {
        acc[index] = { ...item };
        acc[index].instructors = acc[index].instructors?.split(",");
        acc[index].days = acc[index].days.join(",");
        return acc;
      }, {}),

      UserId: userDetails?.UserId,
      visibility: 1,
      status: "OPEN",
      // isPremium: true,
      country: "India",
      creatorEmail: userDetails?.Email ?? null,
    };

    try {
      const response = await fetch(`${baseUrlServer}n_admin/new_data/Studio/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formatedData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Studio added successfully!");
        return data;
      } else {
        alert("Failed to add. Check console for details.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const pushData = async (id, entityType) => {
    const formatedData = {
      ...formData,
      danceStyles: formData.danceStyles.join(","),
      addAmenities: formData.addAmenities.join(","),
      tableData: formData.tableData.reduce((acc, item, index) => {
        acc[index] = { ...item };
        acc[index].instructors = acc[index].instructors?.split(",");
        acc[index].days = acc[index].days.join(",");
        return acc;
      }, {}),
    };

    try {
      const response = await fetch(
        `${baseUrlServer}n_admin/push_data/${id}/${entityType}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formatedData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Studio details updated successfully!");
      } else {
        console.error("Error pushing data:", data);
        alert("Failed to update. Check console for details.");
      }
    } catch (error) {
      console.error("Push Error:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleStudioClick = (studio) => {
    setIsUpdating(true);

    setSelectedStudio(studio);

    setFormData(() => {
      const formatedData = { ...studio };

      formatedData.danceStyles = formatedData.danceStyles
        .split(",")
        .filter(Boolean);

      formatedData.addAmenities = formatedData.addAmenities
        .split(",")
        .filter(Boolean);

      formatedData.tableData = Object.values(formatedData.tableData).map(
        (item) => ({
          ...item,
          days: updateDaysFormat(item.days.split(",").filter(Boolean)),
          instructors: Array.isArray(item.instructors)
            ? item?.instructors?.join?.(",")
            : item.instructors,
        })
      );

      return formatedData;
    });

    setCurrentWindow(WINDOWS.UPDATE_STUDIO);
  };

  const handleBack = () => {
    setCurrentWindow(WINDOWS.DEFAULT);
    setIsUpdating(false);
    setFormData(initialData);
    setSelectedStudio(null);
    setErrors({});
  };

  const handleSubmit = async (createStudioCallback) => {
    try {
      if (isUpdating) {
        setIsUpdating(false);
        await pushData(selectedStudio.id, "Studio");
        setSelectedStudio(null);
      } else {
        const data = await addData();
        await createStudioCallback(data?.document_id);
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

  return (
    <>
      {(currentWindow === WINDOWS.ADD_STUDIO ||
        currentWindow === WINDOWS.UPDATE_STUDIO) && (
        <AddStudio
          entityId={selectedStudio?.id}
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
            {/* Mode Select */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
                Environment
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(e) => setMode(e.target.value)}
                aria-label="environment"
                fullWidth
                sx={{ 
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    py: 1.5,
                    border: '2px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      backgroundColor: mode === 'STAGING' ? 'warning.main' : 'success.main',
                      color: 'white',
                      borderColor: mode === 'STAGING' ? 'warning.main' : 'success.main',
                      '&:hover': {
                        backgroundColor: mode === 'STAGING' ? 'warning.dark' : 'success.dark',
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="STAGING" aria-label="staging">
                  Staging
                </ToggleButton>
                <ToggleButton value="PRODUCTION" aria-label="production">
                  Production
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Search Section */}
            <Card sx={{ mb: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Search Studios
                  </Typography>
                </Box>

                {/* Search Type */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
                    Search Type
                  </Typography>
                  <ToggleButtonGroup
                    value={searchType}
                    exclusive
                    onChange={changeSearchMode}
                    aria-label="search type"
                    fullWidth
                    sx={{ 
                      '& .MuiToggleButton-root': {
                        flex: 1,
                        py: 1.5,
                        border: '2px solid',
                        borderColor: 'divider',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="EMAIL" aria-label="search by email">
                      <EmailIcon sx={{ mr: 1 }} />
                      Search by Email
                    </ToggleButton>
                    <ToggleButton value="CITY" aria-label="search by city">
                      <LocationIcon sx={{ mr: 1 }} />
                      Search by City
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Search Input */}
                <Box sx={{ mb: 3 }}>
                  {searchType === "EMAIL" ? (
                    <TextField
                      label="Enter Creator Email"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      fullWidth
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  ) : (
                    <Autocomplete
                      options={citiesData.cities}
                      value={searchQuery}
                      onChange={(event, newValue) => {
                        setSearchQuery(newValue || "");
                      }}
                      onInputChange={(event, newInputValue) => {
                        setSearchQuery(newInputValue);
                      }}
                      freeSolo
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select or Enter City Name"
                          variant="outlined"
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1rem' }} />
                          {option}
                        </Box>
                      )}
                      sx={{
                        '& .MuiAutocomplete-inputRoot': {
                          paddingRight: '14px !important',
                        }
                      }}
                    />
                  )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Search Button */}
                <Button
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  onClick={handleSearch}
                  fullWidth
                  size="large"
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {submitting ? "Searching..." : "Search Studios"}
                </Button>
              </CardContent>
            </Card>

            {searchType === "EMAIL" && userDetails && isSubmited && (
              <Box sx={{ display: "flex", justifyContent: "end", mt: 2 }}>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setCurrentWindow(WINDOWS.ADD_STUDIO)}
                >
                  Add Studio
                </Button>
              </Box>
            )}

            {results.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, mb: 1 }}>
                <ToggleButtonGroup
                  value={resultView}
                  exclusive
                  onChange={(e, v) => v && setResultView(v)}
                  size="small"
                  aria-label="result view"
                >
                  <ToggleButton value="list" aria-label="list view">
                    <ListIcon sx={{ mr: 0.5, fontSize: 18 }} /> List
                  </ToggleButton>
                  <ToggleButton value="map" aria-label="map view">
                    <MapIcon sx={{ mr: 0.5, fontSize: 18 }} /> Map
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {results.length > 0 && resultView === "map" && (
              <Box sx={{ mt: 1 }}>
                <AdminEntityMap
                  items={mapItems}
                  countNoun="studio"
                  onItemClick={(item) => handleStudioClick(item._raw)}
                  emptyLabel="None of these studios have a saved location to plot."
                />
              </Box>
            )}

            {results.length > 0 && resultView === "list" && (
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <b>Studio ID</b>
                      </TableCell>
                      <TableCell>
                        <b>Studio Name</b>
                      </TableCell>
                      <TableCell>
                        <b>Creator Email</b>
                      </TableCell>
                      <TableCell>
                        <b>City</b>
                      </TableCell>
                      <TableCell>
                        <b>Founder Name</b>
                      </TableCell>
                      <TableCell>
                        <b>Status</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((studio, index) => (
                      <TableRow
                        key={index}
                        onClick={() => handleStudioClick(studio)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <a
                            href={`${baseUrlRender}#/studio/${studio.id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {studio.id}
                          </a>
                        </TableCell>

                        <TableCell>{studio.studioName}</TableCell>
                        <TableCell>{studio.creatorEmail}</TableCell>
                        <TableCell>{studio.city}</TableCell>
                        <TableCell>{studio.founderName}</TableCell>
                        <TableCell>{studio.status}</TableCell>
                      </TableRow>
                    ))}
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

export default StudioCrud;
