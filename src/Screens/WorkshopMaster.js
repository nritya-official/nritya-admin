import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const workflowSteps = [
  {
    title: "Add / Update",
    subtitle: "Create or edit workshop details, schedules, and metadata.",
    to: "/workshopsCrud",
    cta: "Open Workshop CRUD",
  },
  {
    title: "CRM",
    subtitle: "Find target users and drive workshop reach and follow-ups.",
    to: "/targetUsers",
    cta: "Open Target Users",
  },
  {
    title: "Bookings",
    subtitle: "Track bookings and monitor workshop conversion progress.",
    to: "/workshopBookings",
    cta: "Open Workshop Bookings",
  },
];

function WorkshopMaster() {
  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Workshop Master
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Move through the workflow from workshop setup to CRM to booking
        monitoring.
      </Typography>

      <Grid container spacing={2}>
        {workflowSteps.map((step) => (
          <Grid item xs={12} md={4} key={step.title}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={2} sx={{ height: "100%" }}>
                  <Typography variant="h6">{step.title}</Typography>
                  <Typography color="text.secondary">{step.subtitle}</Typography>
                  <Box sx={{ mt: "auto" }}>
                    <Button
                      component={RouterLink}
                      to={step.to}
                      variant="contained"
                      fullWidth
                    >
                      {step.cta}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default WorkshopMaster;
