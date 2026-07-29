import { useEffect, useState } from "react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { Box, Button, Chip, Typography } from "@mui/material";
import WorkshopRevenueTable from "./WorkshopRevenueTable";
import { SERVERS, DEFAULT_SERVER_MODE } from "../constants";

const WorkshopRevenue = () => {
  const { workshopId } = useParams();
  const [searchParams] = useSearchParams();
  const [workshopName, setWorkshopName] = useState("");

  const requestedMode = searchParams.get("mode");
  const mode = SERVERS[requestedMode] ? requestedMode : DEFAULT_SERVER_MODE;
  const baseUrlServer = SERVERS[mode];

  useEffect(() => {
    // workshop_revenue keys everything by id and returns no name, so it is
    // fetched separately — otherwise this URL is unreadable when opened cold
    // from a bookmark rather than clicked through from the list.
    let cancelled = false;

    const fetchWorkshopName = async () => {
      try {
        const response = await fetch(
          `${baseUrlServer}crud/get_workshop_by_id/${workshopId}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setWorkshopName(data?.name || "");
      } catch (error) {
        console.error("Could not fetch workshop name", error);
      }
    };

    if (workshopId) fetchWorkshopName();
    return () => {
      cancelled = true;
    };
  }, [workshopId, baseUrlServer]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          component={RouterLink}
          to="/workshopsCrud"
          variant="outlined"
          sx={{ minWidth: "100px" }}
        >
          ← Workshops
        </Button>
        <Typography variant="h5" sx={{ textTransform: "none" }}>
          Workshop Revenue{workshopName ? `: ${workshopName}` : ""}
        </Typography>
        <Chip label={mode} size="small" color={mode === "PRODUCTION" ? "error" : "default"} />
      </Box>

      {!workshopId ? (
        <Typography color="error">No workshop id in the URL.</Typography>
      ) : (
        <WorkshopRevenueTable workshopId={workshopId} baseUrlServer={baseUrlServer} />
      )}
    </Box>
  );
};

export default WorkshopRevenue;
