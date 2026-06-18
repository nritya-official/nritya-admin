import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import VirtualizedUserTable from "./VirtualizedUserTable";

const GROUP_OPTIONS = [
  { value: "tier", label: "Priority tier" },
  { value: "signal", label: "Why recommended (signal)" },
  { value: "style", label: "Matched dance style" },
];

const tierOf = (row) => {
  const idx = row.index ?? row.similarity_index ?? 0;
  if (idx >= 0.8) return { key: "hot", label: "Hot (≥ 0.80)", order: 0, color: "success" };
  if (idx >= 0.5) return { key: "warm", label: "Warm (0.50 – 0.79)", order: 1, color: "warning" };
  return { key: "cold", label: "Cold (< 0.50)", order: 2, color: "default" };
};

const signalOf = (row) => {
  const b = row.score_breakdown;
  if (!b) return { key: "unknown", label: "Unscored", order: 3, color: "default" };
  const entries = [
    { key: "style", label: "Style-driven", color: "secondary", value: Number(b.style) || 0 },
    { key: "recency", label: "Recently active", color: "info", value: Number(b.recency) || 0 },
    { key: "activity", label: "Frequent booker", color: "primary", value: Number(b.activity) || 0 },
  ];
  entries.sort((a, b2) => b2.value - a.value);
  const top = entries[0];
  if (top.value <= 0) return { key: "unknown", label: "Unscored", order: 3, color: "default" };
  const orderMap = { style: 0, recency: 1, activity: 2 };
  return { key: top.key, label: top.label, order: orderMap[top.key], color: top.color };
};

const styleGroupsOf = (row) => {
  const styles = Array.isArray(row.matched_styles) ? row.matched_styles : [];
  if (styles.length === 0) return [{ key: "unknown", label: "Unmatched", color: "default" }];
  return styles.map((s) => ({ key: s, label: s, color: "secondary" }));
};

const tierBreakdown = (rows) => {
  const counts = { hot: 0, warm: 0, cold: 0 };
  rows.forEach((r) => {
    counts[tierOf(r).key] += 1;
  });
  return counts;
};

export default function ClusteredUserView({ rows, getWhatsAppLink }) {
  const [groupBy, setGroupBy] = useState("tier");

  const groups = useMemo(() => {
    const map = new Map();

    const place = (groupKey, label, color, order, row) => {
      if (!map.has(groupKey)) {
        map.set(groupKey, { key: groupKey, label, color, order, rows: [] });
      }
      map.get(groupKey).rows.push(row);
    };

    rows.forEach((row) => {
      if (groupBy === "tier") {
        const t = tierOf(row);
        place(t.key, t.label, t.color, t.order, row);
      } else if (groupBy === "signal") {
        const s = signalOf(row);
        place(s.key, s.label, s.color, s.order, row);
      } else {
        // style — a user can appear under each matched style
        styleGroupsOf(row).forEach((g) => place(g.key, g.label, g.color, 0, row));
      }
    });

    const arr = Array.from(map.values()).map((g) => ({
      ...g,
      rows: [...g.rows].sort(
        (a, b) => (b.index ?? b.similarity_index ?? 0) - (a.index ?? a.similarity_index ?? 0)
      ),
    }));

    arr.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (b.rows.length !== a.rows.length) return b.rows.length - a.rows.length;
      return a.label.localeCompare(b.label);
    });
    return arr;
  }, [rows, groupBy]);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
        sx={{ mb: 1.5 }}
      >
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="cluster-group-by">Group by</InputLabel>
          <Select
            labelId="cluster-group-by"
            label="Group by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            {GROUP_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary">
          {groups.length} segment{groups.length === 1 ? "" : "s"}
          {groupBy === "style" && " · users may appear in multiple style segments"}
        </Typography>
      </Stack>

      {groups.map((g, idx) => {
        const counts = tierBreakdown(g.rows);
        return (
          <Accordion key={g.key} defaultExpanded={idx === 0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                sx={{ width: "100%", pr: 1 }}
              >
                <Chip size="small" color={g.color} label={g.label} sx={{ fontWeight: 600 }} />
                <Chip size="small" variant="outlined" label={`${g.rows.length} users`} />
                <Box sx={{ flexGrow: 1 }} />
                <Chip size="small" variant="outlined" color="success" label={`Hot ${counts.hot}`} />
                <Chip size="small" variant="outlined" color="warning" label={`Warm ${counts.warm}`} />
                <Chip size="small" variant="outlined" label={`Cold ${counts.cold}`} />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <VirtualizedUserTable rows={g.rows} getWhatsAppLink={getWhatsAppLink} />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
