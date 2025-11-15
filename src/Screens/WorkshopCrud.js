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
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  LocalOffer as LocalOfferIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import axios from "axios";
import WorkshopForm from "../Components/workshop-crud/WorkshopForm";
import WorkshopRevenueTable from "./WorkshopRevenueTable";
import { BASEURL_PROD } from "../constants";
import citiesData from "../cities.json";

const WINDOWS = {
  DEFAULT: "default",
  ADD_WORKSHOP: "addWorkshop",
  UPDATE_WORKSHOP: "updateWorkshop",
  WORKSHOP_REVENUE: "workshopRevenue",
};
const local = "http://0.0.0.0:8000/"
// Mode URLs
const server = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
};

const render = {
  PRODUCTION: "https://www.nritya.co.in/",
  STAGING: "https://nritya-webapp-ssr-1-b3a1c0b4b8f2.herokuapp.com/",
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
  const [citySearchStatus, setCitySearchStatus] = useState("UPCOMING");
  const [creatorSearchStatus, setCreatorSearchStatus] = useState("UPCOMING");
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
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workshopToDelete, setWorkshopToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Discount management state
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedWorkshopForDiscount, setSelectedWorkshopForDiscount] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [newDiscount, setNewDiscount] = useState({
    discount_type: "percentage",
    discount_value: "",
    discount_bearer: "NRITYA",
    description: "",
    is_active: true
  });

  const handleSearch = async () => {
    let searchUrl = `${baseUrlServer}crud/get_workshops_by_creator/`;

    if (searchType === "EMAIL") {
      // Map creator search status to appropriate endpoint
      const creatorEndpoints = {
        "ALL": "get_workshops_by_creator",
        "CONCLUDED": "get_concluded_workshops_by_creator",
        "ONGOING": "get_ongoing_workshops_by_creator",
        "UPCOMING": "get_upcoming_workshops_by_creator"
      };
      
      const endpoint = creatorEndpoints[creatorSearchStatus];
      if (!endpoint) {
        return alert("Invalid creator search status");
      }
      
      searchUrl = `${baseUrlServer}crud/${endpoint}/${searchQuery?.trim?.()}`;
      
      console.log("=== CREATOR SEARCH DEBUG ===");
      console.log("Creator search URL:", searchUrl);
      console.log("Creator email:", searchQuery);
      console.log("Status:", creatorSearchStatus);

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
      setUserDetails(null);
      
      // Map city search status to appropriate endpoint
      const cityEndpoints = {
        "ALL": "get_workshops_by_city",
        "CONCLUDED": "get_concluded_workshops_by_city",
        "ONGOING": "get_ongoing_workshops_by_city",
        "UPCOMING": "get_upcoming_workshops_by_city"
      };
      
      const endpoint = cityEndpoints[citySearchStatus];
      if (!endpoint) {
        return alert("Invalid city search status");
      }
      
      searchUrl = `${baseUrlServer}crud/${endpoint}/${searchQuery?.trim?.()}`;
      
      console.log("=== CITY SEARCH DEBUG ===");
      console.log("City search URL:", searchUrl);
      console.log("City:", searchQuery);
      console.log("Status:", citySearchStatus);
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
      time: variant.startTime && variant.endTime ? `${variant.startTime}-${variant.endTime}` : (variant.time || ""),
      description: variant.description || "",
      subvariants: variant.subvariants.map((sub, pIndex) => ({
        subvariant_id: `NEW_${index}_${pIndex + 1}`,
        price: sub.price || "",
        capacity: sub.capacity || "",
        description: sub.description || "",
        is_time_sensitive: !!sub.is_time_sensitive,
        time_sensitive_date:
          sub.is_time_sensitive && sub.time_sensitive_date
            ? sub.time_sensitive_date
            : null,
        time_sensitive_time:
          sub.is_time_sensitive && sub.time_sensitive_time
            ? sub.time_sensitive_time
            : null,
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
      time: variant.startTime && variant.endTime ? `${variant.startTime}-${variant.endTime}` : (variant.time || ""),
      description: variant.description || "",
      subvariants: variant.subvariants.map((sub, pIndex) => ({
        subvariant_id: selectedWorkshop?.variants?.[index]?.subvariants?.[pIndex]?.subvariant_id || `NEW_${index}_${pIndex + 1}`,
        price: sub.price || "",
        capacity: sub.capacity || "",
        description: sub.description || "",
        is_time_sensitive: !!sub.is_time_sensitive,
        time_sensitive_date:
          sub.is_time_sensitive && sub.time_sensitive_date
            ? sub.time_sensitive_date
            : null,
        time_sensitive_time:
          sub.is_time_sensitive && sub.time_sensitive_time
            ? sub.time_sensitive_time
            : null,
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
              is_time_sensitive: false,
              time_sensitive_date: null,
              time_sensitive_time: null,
            },
          ],
        },
      ];

      formatedData.variants = formatedData.variants.map((variant) => ({
        ...variant,
        subvariants: (variant.subvariants || []).map((sub) => ({
          ...sub,
          time_sensitive_date: sub.time_sensitive_date || null,
          time_sensitive_time: sub.time_sensitive_time || null,
          is_time_sensitive:
            sub.is_time_sensitive !== undefined
              ? sub.is_time_sensitive
              : !!(sub.time_sensitive_date || sub.time_sensitive_time),
        })),
      }));

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
    setCitySearchStatus("UPCOMING"); // Reset city search status
    setCreatorSearchStatus("UPCOMING"); // Reset creator search status
  };

  const handleDelete = (workshop) => {
    setWorkshopToDelete(workshop);
    setDeleteConfirmationText("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationText !== "DELETE") {
      alert("Please type 'DELETE' to confirm deletion.");
      return;
    }

    if (!workshopToDelete) return;

    try {
      const response = await fetch(`${baseUrlServer}crud/delete_workshop/${workshopToDelete.workshop_id}`, {
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
    } finally {
      setDeleteDialogOpen(false);
      setWorkshopToDelete(null);
      setDeleteConfirmationText("");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setWorkshopToDelete(null);
    setDeleteConfirmationText("");
  };

  const handleExportJson = async (workshop) => {
    try {
      const response = await fetch(`${baseUrlServer}crud/get_workshop_by_id/${workshop.workshop_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const workshopData = await response.json();
        
        // Create and download JSON file
        const dataStr = JSON.stringify(workshopData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `workshop_${workshop.workshop_id}_${workshop.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else {
        alert("Failed to fetch workshop data for export.");
      }
    } catch (error) {
      console.error("Error exporting workshop", error);
      alert("Failed to export workshop data.");
    }
  };

  const handleRevenue = (workshop) => {
    // Set the selected workshop for revenue display
    setSelectedWorkshop(workshop);
    setCurrentWindow('WORKSHOP_REVENUE');
  };

  // Discount management handlers
  const handleOpenDiscountDialog = async (workshop) => {
    setSelectedWorkshopForDiscount(workshop);
    setDiscountDialogOpen(true);
    await fetchDiscounts(workshop.workshop_id);
  };

  const handleCloseDiscountDialog = () => {
    setDiscountDialogOpen(false);
    setSelectedWorkshopForDiscount(null);
    setDiscounts([]);
    setEditingDiscount(null);
    setNewDiscount({
      discount_type: "percentage",
      discount_value: "",
      discount_bearer: "NRITYA",
      description: "",
      is_active: true
    });
  };

  const fetchDiscounts = async (workshopId) => {
    setLoadingDiscounts(true);
    try {
      const response = await axios.get(`${baseUrlServer}crud/discounts/${workshopId}/`);
      setDiscounts(response.data.discounts || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      alert("Failed to fetch discounts");
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setNewDiscount({
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      discount_bearer: discount.discount_bearer,
      description: discount.description,
      is_active: discount.is_active
    });
  };

  const handleCancelEdit = () => {
    setEditingDiscount(null);
    setNewDiscount({
      discount_type: "percentage",
      discount_value: "",
      discount_bearer: "NRITYA",
      description: "",
      is_active: true
    });
  };

  const handleCreateOrUpdateDiscount = async () => {
    if (!newDiscount.discount_value || !newDiscount.description) {
      alert("Please fill in discount value and description");
      return;
    }

    try {
      if (editingDiscount) {
        // Update existing discount
        const payload = {
          discount_type: newDiscount.discount_type,
          discount_value: parseFloat(newDiscount.discount_value),
          discount_bearer: newDiscount.discount_bearer,
          description: newDiscount.description,
          is_active: newDiscount.is_active
        };

        await axios.put(`${baseUrlServer}crud/discounts/${editingDiscount.discount_id}/update/`, payload);
        alert("Discount updated successfully!");
      } else {
        // Create new discount
        const payload = {
          workshop_id: selectedWorkshopForDiscount.workshop_id,
          discount_type: newDiscount.discount_type,
          discount_value: parseFloat(newDiscount.discount_value),
          discount_bearer: newDiscount.discount_bearer,
          description: newDiscount.description,
          is_active: newDiscount.is_active
        };

        await axios.post(`${baseUrlServer}crud/discounts/create/`, payload);
        alert("Discount created successfully!");
      }
      
      // Reset form and refresh discounts
      setEditingDiscount(null);
      setNewDiscount({
        discount_type: "percentage",
        discount_value: "",
        discount_bearer: "NRITYA",
        description: "",
        is_active: true
      });
      await fetchDiscounts(selectedWorkshopForDiscount.workshop_id);
    } catch (error) {
      console.error("Error saving discount:", error);
      alert(`Failed to save discount: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) {
      return;
    }

    try {
      await axios.delete(`${baseUrlServer}crud/discounts/${discountId}/delete/`);
      alert("Discount deleted successfully!");
      
      // If we were editing this discount, cancel the edit
      if (editingDiscount && editingDiscount.discount_id === discountId) {
        handleCancelEdit();
      }
      
      await fetchDiscounts(selectedWorkshopForDiscount.workshop_id);
    } catch (error) {
      console.error("Error deleting discount:", error);
      alert(`Failed to delete discount: ${error.response?.data?.error || error.message}`);
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

      {currentWindow === WINDOWS.WORKSHOP_REVENUE && (
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => setCurrentWindow(WINDOWS.DEFAULT)}
              sx={{ minWidth: '100px' }}
            >
              ← Back
            </Button>
            <Typography variant="h5" sx={{ textTransform: 'none' }}>
              Workshop Revenue: {selectedWorkshop?.name || 'Loading...'}
            </Typography>
          </Box>
          <WorkshopRevenueTable workshopId={selectedWorkshop?.workshop_id} />
        </Box>
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

            <br />

            {/* Search Section */}
            <Card sx={{ mb: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Search Workshops
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

            {/* Status Filter Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  Workshop Status Filter
                </Typography>
              </Box>
              
              {/* City Search Status Filter */}
              {searchType === "CITY" && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {[
                    { value: "ALL", label: "All", color: "default" },
                    { value: "CONCLUDED", label: "Concluded", color: "error" },
                    { value: "ONGOING", label: "Ongoing", color: "warning" },
                    { value: "UPCOMING", label: "Upcoming", color: "success" }
                  ].map((status) => (
                    <Chip
                      key={status.value}
                      label={status.label}
                      clickable
                      color={citySearchStatus === status.value ? status.color : "default"}
                      variant={citySearchStatus === status.value ? "filled" : "outlined"}
                      onClick={() => setCitySearchStatus(status.value)}
                      sx={{
                        fontWeight: citySearchStatus === status.value ? 'bold' : 'normal',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        }
                      }}
                    />
                  ))}
                </Stack>
              )}

              {/* Creator Search Status Filter */}
              {searchType === "EMAIL" && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {[
                    { value: "ALL", label: "All", color: "default" },
                    { value: "CONCLUDED", label: "Concluded", color: "error" },
                    { value: "ONGOING", label: "Ongoing", color: "warning" },
                    { value: "UPCOMING", label: "Upcoming", color: "success" }
                  ].map((status) => (
                    <Chip
                      key={status.value}
                      label={status.label}
                      clickable
                      color={creatorSearchStatus === status.value ? status.color : "default"}
                      variant={creatorSearchStatus === status.value ? "filled" : "outlined"}
                      onClick={() => setCreatorSearchStatus(status.value)}
                      sx={{
                        fontWeight: creatorSearchStatus === status.value ? 'bold' : 'normal',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        }
                      }}
                    />
                  ))}
                </Stack>
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
              {submitting ? "Searching..." : `Search ${searchType === "CITY" ? `(${citySearchStatus})` : searchType === "EMAIL" ? `(${creatorSearchStatus})` : ""}`}
            </Button>
              </CardContent>
            </Card>

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
                      //console.log(`=== WORKSHOP ${index} TABLE DISPLAY DEBUG ===`);
                      //console.log("Workshop data:", workshop);
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
                             target="_blank"
                              href={`${baseUrlRender}/workshop/${workshop.workshop_id}`}
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
                                //disabled={!getDraftStatus(workshop.creation_time).isDraftActive}
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
                            <Tooltip>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleRevenue(workshop)}
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
                                Revenue
                              </Button>
                            </Tooltip>
                            <Tooltip title="Manage discounts">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleOpenDiscountDialog(workshop)}
                                sx={{ 
                                  fontSize: "12px", 
                                  py: 0, 
                                  bgcolor: "#28a745",
                                  color: "white",
                                  textTransform: "capitalize",
                                  '&:hover': { 
                                    bgcolor: "#28a745", 
                                    color: "white"
                                  }
                                }}
                              >
                                Discount
                              </Button>
                            </Tooltip>
                            <Tooltip title="Export workshop data as JSON">
                              <DownloadIcon
                     
                                
                                onClick={() => handleExportJson(workshop)}
                                sx={{ 
                                  
                                  py: 0, 
                                  bgcolor: "#735a8b",
                                  color: "white",
                                  cursor: "pointer",
                                  '&:hover': { 
                                    bgcolor: "#28a745", 
                                    color: "white"
                                  }
                                }}
                              >
                            
                              </DownloadIcon>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "#dc3545", fontWeight: 600 }}>
          Confirm Workshop Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the workshop:
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, color: "#dc3545", fontWeight: 600 }}>
            "{workshopToDelete?.name}"
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
            This action cannot be undone. All workshop data, bookings, and related information will be permanently deleted.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            To confirm deletion, please type <strong>DELETE</strong> in the box below:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type DELETE to confirm"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#dc3545",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#dc3545",
                },
              },
            }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={deleteConfirmationText !== "DELETE"}
            sx={{
              bgcolor: "#dc3545",
              color: "white",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#c82333",
              },
              "&.Mui-disabled": {
                bgcolor: "#6c757d",
                color: "white",
              },
            }}
          >
            Delete Workshop
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discount Management Dialog */}
      <Dialog
        open={discountDialogOpen}
        onClose={handleCloseDiscountDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, bgcolor: "#28a745", color: "white" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalOfferIcon />
            Manage Discounts - {selectedWorkshopForDiscount?.name}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Create/Update Discount Form - Only show if no active discount or editing */}
          {(discounts.length === 0 || editingDiscount) && (
            <Card sx={{ mb: 3, bgcolor: editingDiscount ? "#fff3cd" : "#f8f9fa" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {editingDiscount ? "✏️ Update Discount" : <><AddIcon /> Create New Discount</>}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <TextField
                        label="Discount Value (%)"
                        type="number"
                        value={newDiscount.discount_value}
                        onChange={(e) => setNewDiscount({ ...newDiscount, discount_value: e.target.value })}
                        placeholder="e.g., 20"
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <TextField
                        select
                        label="Discount Bearer"
                        value={newDiscount.discount_bearer}
                        onChange={(e) => setNewDiscount({ ...newDiscount, discount_bearer: e.target.value })}
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="NRITYA">NRITYA</option>
                        <option value="WORKSHOP_OWNER">WORKSHOP_OWNER</option>
                        <option value="SHARED">SHARED</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={newDiscount.description}
                      onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                      placeholder="e.g., 20% Platform Discount"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={handleCreateOrUpdateDiscount}
                        sx={{ 
                          bgcolor: editingDiscount ? "#ffc107" : "#28a745",
                          color: editingDiscount ? "#000" : "#fff",
                          '&:hover': { bgcolor: editingDiscount ? "#e0a800" : "#218838" }
                        }}
                      >
                        {editingDiscount ? "Update Discount" : "Create Discount"}
                      </Button>
                      {editingDiscount && (
                        <Button
                          variant="outlined"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Existing Discounts List */}
          <Typography variant="h6" gutterBottom>
            Active Discounts
          </Typography>
          
          {/* Info message when discount exists and not editing */}
          {discounts.length > 0 && !editingDiscount && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Only one active discount is allowed per workshop. You can update or delete the existing discount.
            </Alert>
          )}
          
          {loadingDiscounts ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Loading discounts...</Typography>
            </Box>
          ) : discounts.length === 0 ? (
            <Alert severity="info">No active discounts for this workshop</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Value</strong></TableCell>
                    <TableCell><strong>Bearer</strong></TableCell>
                    <TableCell><strong>Promo Code</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discounts.map((discount) => (
                    <TableRow key={discount.discount_id}>
                      <TableCell>{discount.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={discount.discount_type} 
                          size="small" 
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{discount.discount_value}%</TableCell>
                      <TableCell>
                        <Chip 
                          label={discount.discount_bearer} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{discount.promo_code || 'N/A'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit discount">
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => handleEditDiscount(discount)}
                              sx={{ 
                                color: "#ffc107",
                                minWidth: 'auto',
                                p: 0.5
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete discount">
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => handleDeleteDiscount(discount.discount_id)}
                              sx={{ 
                                color: "#dc3545",
                                minWidth: 'auto',
                                p: 0.5
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDiscountDialog} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default WorkshopCrud;
