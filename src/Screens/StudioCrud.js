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
} from "@mui/material";
import axios from "axios";
import AddStudio from "../Components/studio-crud/AddStudio";
import { updateDaysFormat } from "../utils/mapping";

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

  const baseUrlServer = server[mode];
  const baseUrlRender = render[mode];

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
            <Typography variant="h5" gutterBottom>
              Studio CRUD
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
              <TableContainer component={Paper} sx={{ mt: 4 }}>
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
