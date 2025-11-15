import { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Modal,
  useTheme,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Form } from "react-bootstrap";
import { Alert } from "@mui/lab";
import { useLoading } from "../context/LoadingContext";

const statusFlags = [
  "Submitted",
  "Verified",
  "Under Review",
  "Reviewed",
  "Verification Failed",
];
const names_map = new Map([
  ["first_name", "First Name"],
  ["middle_last_name", "Middle & Last Name"],
  ["phone_number", "Phone Number"],
  ["street_address", "Street Address"],
  ["city", "City"],
  ["state_province", "State"],
  ["state", "State"],
  ["zip_pin_code", "PIN Code/ZIP"],
  ["aadhar", "Aadhar Number"],
  ["gstin", "Gst Number"],
  ["comments", "Remark(s)"],
  ["UserId", "UserId"],
  ["id", "KYC ID"],
  ["status", "Status"],
  ["country", "Country"],
  ["hash", "Hash"],
]);

const modes = {
  staging: {
    baseURL: "https://nrityaserver-2b241e0a97e5.herokuapp.com",
  },
  production: {
    baseURL: "https://djserver-production-ffe37b1b53b5.herokuapp.com",
  },
};

const modesList = Object.keys(modes);

function UserKycsNew() {
  const { showLoading, hideLoading } = useLoading();
  const theme = useTheme();
  const [kycData, setKycData] = useState({});
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [docUrls, setDocUrls] = useState({});
  const [runMode, setRunMode] = useState(modesList[0]);
  const [openModal, setOpenModal] = useState(false);

  const tableCellStyle = {
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRight: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
  };

  const tableHeaderStyle = {
    ...tableCellStyle,
    backgroundColor: theme.palette.background.paper,
    fontWeight: "bold",
  };

  const cardStyle = {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: 8,
  };

  const textAreaStyle = {
    padding: 8,
    width: "100%",
    height: "auto",
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderColor: theme.palette.divider,
  };

  const selectStyle = {
    padding: 12,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderColor: theme.palette.divider,
  };
  const url = `${modes[runMode].baseURL}/crud/getKyc/`
  console.log("User KYC url", url)

  useEffect(() => {
    showLoading();
    fetch(url)
      .then((res) => res.json())
      .then((data) => setKycData(data.data))
      .catch((err) => console.error("Error fetching KYC data:", err))
      .finally(hideLoading);
  }, [runMode]);

  const handleChange = (field, value) => {
    if (!selectedKyc) return;

    setSelectedKyc((prevKyc) => ({
      ...prevKyc,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (!selectedKyc) return;

    const { id } = selectedKyc;
    console.log(docUrls);

    if (docUrls[id] && (docUrls[id].aadhar || docUrls[id].gst)) {
      return;
    }

    const docUrl = `${modes[runMode].baseURL}/crud/getKycDoc/${id}`;

    fetch(docUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocUrls((prev) => ({
            ...prev,
            [id]: {
              aadhar: data.data.Aadhar || "",
              gst: data.data.Gst || "",
            },
          }));
        }
      })
      .catch((err) => {
        console.error("Error fetching document URLs:", err);
      });
  }, [selectedKyc]);

  const handleRowClick = (kyc, id, status) => {
    setSelectedKyc({ ...kyc, id, status });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSubmit = () => {
    if (!selectedKyc) {
      setErrorMsg("No KYC record selected.");
      return;
    }
    console.log(selectedKyc);
    const { id, status, comments } = selectedKyc;

    setStatusLoading(true);
    setErrorMsg("");

    const requestData = {
      data: {
        status,
        comments,
      },
    };

    fetch(`${modes[runMode].baseURL}/crud/kycApproval/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update KYC record.");
        }
        return response.json();
      })
      .then((data) => {
        setKycData((prevData) => {
          const updatedData = { ...prevData };

          Object.keys(updatedData).forEach((statusKey) => {
            if (updatedData[statusKey]?.data?.[selectedKyc.id]) {
              updatedData[statusKey].count = Math.max(
                0,
                updatedData[statusKey].count - 1
              );
              delete updatedData[statusKey].data[selectedKyc.id];
            }
          });

          if (!updatedData[status]) {
            updatedData[status] = { data: {}, count: 0 };
          }

          updatedData[status].data[selectedKyc.id] = {
            ...selectedKyc,
            status: status,
            comments: comments,
          };

          updatedData[status].count = updatedData[status].count + 1;

          return updatedData;
        });

        console.log(kycData);
        setStatusLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMsg("An error occurred while updating the KYC record.");
        setStatusLoading(false);
      });
  };

  const downloadDoc = (docType, id) => {
    const url = docUrls[id]?.[docType];
    if (url) {
      window.open(url, "_blank");
    } else {
      alert(`${docType} document is not available.`);
    }
  };

  const handleRunModeChange = (_, newRunMode) => {
    if (newRunMode !== null) {
      setRunMode(newRunMode);
      setKycData({});
      setSelectedKyc(null);
      setStatusLoading(false);
      setErrorMsg("");
      setDocUrls({});
    }
  };

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      <Grid item>
        <ToggleButtonGroup
          exclusive
          color="primary"
          value={runMode}
          onChange={handleRunModeChange}
        >
          {modesList.map((mode, index) => (
            <ToggleButton
              key={index}
              value={mode}
              sx={{ textTransform: "capitalize" }}
            >
              {mode}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Grid>

      <Grid item xs={12} container spacing={2}>
        {kycData &&
          Object.keys(kycData).map((status) => (
            <Grid item xs={12} sm={6} md={2} key={status}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{status}</Typography>
                  <Typography variant="h4">
                    {kycData[status]?.count || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Grid item xs={12} container spacing={2}>
        <Grid item xs={12}>
          <TableContainer
            sx={{
              borderRadius: 2,
              border: 1,
              borderColor: theme.palette.divider,
            }}
          >
            <Table
              stickyHeader
              sx={{
                borderCollapse: "collapse",
                borderStyle: "hidden",
                "& td": {
                  border: 1,
                  borderColor: theme.palette.divider,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      ...tableHeaderStyle,
                      minWidth: "150px",
                      borderRadius: 2,
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell sx={{ ...tableHeaderStyle, minWidth: "150px" }}>
                    First Name
                  </TableCell>
                  <TableCell sx={{ ...tableHeaderStyle, minWidth: "150px" }}>
                    City
                  </TableCell>
                  <TableCell sx={{ ...tableHeaderStyle, minWidth: "150px" }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kycData &&
                  Object.keys(kycData).map((status) =>
                    Object.keys(kycData[status]?.data || {}).map((id) => {
                      const kyc = kycData[status].data[id];
                      return (
                        <TableRow
                          hover
                          key={id}
                          role="checkbox"
                          tabIndex={-1}
                          onClick={() => handleRowClick(kyc, id, status)}
                          style={{ cursor: "pointer" }}
                          sx={{
                            bgcolor:
                              selectedKyc?.id === id
                                ? theme.palette.action.selected
                                : theme.palette.background.paper,
                            "&:hover": {
                              bgcolor: `${theme.palette.action.hover} !important`,
                            },
                          }}
                        >
                          <TableCell sx={tableCellStyle}>{id}</TableCell>
                          <TableCell sx={tableCellStyle}>
                            {kyc.first_name}
                          </TableCell>
                          <TableCell sx={tableCellStyle}>{kyc.city}</TableCell>
                          <TableCell sx={tableCellStyle}>
                            {kyc.status}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Modal open={openModal} onClose={handleCloseModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: "800px",
              bgcolor: theme.palette.background.paper,
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: "absolute",
                right: 16,
                top: 16,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.action.hover,
                "&:hover": {
                  backgroundColor: theme.palette.action.selected,
                },
              }}
            >
              <CloseIcon />
            </IconButton>

            {selectedKyc && (
              <Card variant="outlined" style={cardStyle}>
                <CardContent>
                  <Grid container spacing={2}>
                    {Array.from(names_map.keys())
                      .filter(
                        (key) =>
                          key !== "status" &&
                          key !== "hash" &&
                          key !== "country" &&
                          key !== "comments" &&
                          selectedKyc[key] !== undefined
                      )
                      .map((key) => (
                        <Grid item xs={6} key={key}>
                          <Typography>
                            <strong>{names_map.get(key)}:</strong>{" "}
                            {selectedKyc[key]}
                          </Typography>
                        </Grid>
                      ))}
                  </Grid>
                  <div style={{ marginTop: "20px" }}>
                    <Form.Control
                      type="text"
                      placeholder="Add Comment"
                      value={selectedKyc.comments || ""}
                      onChange={(e) => handleChange("comments", e.target.value)}
                      as="textarea"
                      style={textAreaStyle}
                      rows={4}
                    />

                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Form.Select
                        value={selectedKyc.status}
                        onChange={(e) => handleChange("status", e.target.value)}
                        style={selectStyle}
                      >
                        {statusFlags.map((flag) => (
                          <option key={flag} value={flag}>
                            {flag}
                          </option>
                        ))}
                      </Form.Select>

                      <Button
                        variant="contained"
                        disabled={statusLoading}
                        onClick={handleSubmit}
                        sx={{
                          marginTop: "10px",
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                        }}
                      >
                        {statusLoading ? "Submitting..." : "Submit Changes"}
                      </Button>
                    </Box>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <Button
                      variant="contained"
                      disabled={
                        !docUrls[selectedKyc.id] ||
                        !docUrls[selectedKyc.id].aadhar
                      }
                      onClick={() => downloadDoc("aadhar", selectedKyc.id)}
                      sx={{
                        marginRight: "10px",
                        backgroundColor: theme.palette.success.main,
                        color: theme.palette.success.contrastText,
                      }}
                    >
                      {!docUrls[selectedKyc.id] ||
                      !docUrls[selectedKyc.id].aadhar
                        ? "Loading Aadhar File..."
                        : "Download Aadhar"}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={
                        !docUrls[selectedKyc.id] || !docUrls[selectedKyc.id].gst
                      }
                      onClick={() => downloadDoc("gst", selectedKyc.id)}
                      sx={{
                        marginLeft: "10px",
                        backgroundColor: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                      }}
                    >
                      {!docUrls[selectedKyc.id] || !docUrls[selectedKyc.id].gst
                        ? "Loading Gst File..."
                        : "Download Gst"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          </Box>
        </Modal>
      </Grid>
    </Grid>
  );
}

export default UserKycsNew;
