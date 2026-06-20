import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Box, Typography, IconButton, Chip, Button } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NearMeIcon from "@mui/icons-material/NearMe";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "maplibre-gl/dist/maplibre-gl.css";

// Free, key-less vector tiles (https://openfreemap.org/quick_start/).
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const PIN_COLORS = ["#E91E63", "#22C55E", "#F59E0B", "#3B82F6", "#A855F7", "#EF4444"];

const DEFAULT_CENTER = { lat: 28.4595, lng: 77.0266 }; // Gurugram fallback

// Accepts {lat,lng} objects or "lat,lng" strings and returns {lat,lng} or null.
export const parseGeo = (geo) => {
  if (!geo) return null;
  if (typeof geo === "object" && geo.lat != null && geo.lng != null) {
    const lat = parseFloat(geo.lat);
    const lng = parseFloat(geo.lng);
    return Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng };
  }
  if (typeof geo !== "string") return null;
  const parts = geo.split(",");
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  return Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng };
};

const escapeHtml = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const createPinElement = (color) => {
  const el = document.createElement("div");
  el.className = "nritya-map-pin";
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = color;
  el.style.border = "3px solid #ffffff";
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.transition = "all 0.15s ease";
  el.style.boxSizing = "content-box";
  return el;
};

const stylePin = (el, selected) => {
  if (!el) return;
  el.style.width = selected ? "24px" : "18px";
  el.style.height = selected ? "24px" : "18px";
  el.style.boxShadow = selected
    ? "0 0 0 4px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.35)"
    : "0 2px 6px rgba(0,0,0,0.3)";
  el.style.zIndex = selected ? "2" : "1";
};

const buildPopupHtml = (item) => {
  const name = escapeHtml(item?.name || "Place");
  const address = item?.addressLine ? escapeHtml(item.addressLine) : "";
  const meta = item?.meta ? escapeHtml(item.meta) : "";
  const directions = item?.geo
    ? `https://www.google.com/maps?q=${item.geo.lat},${item.geo.lng}`
    : "";
  return `
    <div style="width:220px;font-family:inherit;">
      <div style="font-weight:700;font-size:0.95rem;color:#111827;line-height:1.25;">${name}</div>
      ${address ? `<div style="margin-top:4px;font-size:0.78rem;color:#6b7280;line-height:1.3;">${address}</div>` : ""}
      ${meta ? `<div style="margin-top:2px;font-size:0.74rem;color:#6b7280;line-height:1.3;">${meta}</div>` : ""}
      ${directions
        ? `<a href="${directions}" target="_blank" rel="noopener noreferrer" style="margin-top:8px;display:inline-flex;align-items:center;gap:4px;color:#735EAB;font-weight:700;font-size:0.82rem;text-decoration:none;">📍 Get Directions</a>`
        : ""}
    </div>`;
};

const Thumb = ({ image, name, size }) =>
  image ? (
    <Box
      component="img"
      src={image}
      alt={name || "Place"}
      sx={{ width: size, height: size, objectFit: "cover", borderRadius: "10px", flexShrink: 0, bgcolor: "#eee" }}
    />
  ) : (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "10px",
        flexShrink: 0,
        bgcolor: "#ece8f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LocationOnIcon sx={{ color: "#735EAB" }} />
    </Box>
  );

const SidebarCard = ({ item, isActive, onClick, onEdit }) => (
  <Box
    onClick={onClick}
    sx={{
      display: "flex",
      gap: 1.25,
      p: 1,
      borderRadius: "12px",
      backgroundColor: "#fff",
      cursor: "pointer",
      border: isActive ? "2px solid #735EAB" : "1px solid rgba(17,24,39,0.08)",
      boxShadow: isActive ? "0 6px 18px rgba(115,94,171,0.22)" : "0 1px 4px rgba(0,0,0,0.06)",
      transition: "all 0.15s ease",
    }}
  >
    <Thumb image={item.image} name={item.name} size={72} />
    <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
      {item.badge && (
        <Chip
          label={item.badge}
          size="small"
          sx={{ alignSelf: "flex-start", height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#ece8f6", color: "#5a4576", mb: 0.4, "& .MuiChip-label": { px: 0.8 } }}
        />
      )}
      <Typography
        sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}
      >
        {item.name || "Place"}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.3 }}>
        <LocationOnIcon sx={{ fontSize: 13, color: "#9ca3af" }} />
        <Typography sx={{ fontSize: "0.72rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.addressLine || "—"}
        </Typography>
      </Box>
      {item.meta && (
        <Typography sx={{ fontSize: "0.72rem", color: "#6b7280", mt: 0.2 }}>{item.meta}</Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.6 }}>
        {onEdit && (
          <Button
            size="small"
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            sx={{ bgcolor: "#735a8b", textTransform: "none", fontSize: "0.7rem", py: 0.2, minWidth: 0, px: 1.2, "&:hover": { bgcolor: "#5a4576" } }}
          >
            {item.ctaLabel || "Edit"}
          </Button>
        )}
        {item.viewUrl && (
          <Button
            size="small"
            variant="text"
            href={item.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.2, minWidth: 0, px: 1, color: "#735a8b" }}
          >
            View
          </Button>
        )}
      </Box>
    </Box>
  </Box>
);

/**
 * Admin map (MapLibre GL + OpenFreeMap tiles) for listing places. Desktop shows
 * a scrollable list on the left + map on the right; mobile shows a full-width
 * map with a synced bottom carousel. Clicking a card's action fires onItemClick.
 *
 * @param {Array} items Normalized entries: { key, geo:{lat,lng}, name, image,
 *   addressLine, meta, badge, viewUrl, ctaLabel }
 * @param {Function} onItemClick Called with the original item when "Edit" is tapped.
 */
const AdminEntityMap = ({ items = [], onItemClick, countNoun = "place", emptyLabel, height = "62vh" }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const maplibreRef = useRef(null);
  const markersRef = useRef({});
  const popupRef = useRef(null);
  const carouselRef = useRef(null);
  const cardRefs = useRef({});
  const sidebarRefs = useRef({});

  const [mapReady, setMapReady] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  const points = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .filter((it) => it && it.geo && Number.isFinite(it.geo.lat) && Number.isFinite(it.geo.lng))
      .map((it, i) => ({ ...it, color: PIN_COLORS[i % PIN_COLORS.length] }));
  }, [items]);

  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      maplibreRef.current = maplibregl;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        zoom: 10,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
      map.on("load", () => {
        if (!cancelled) setMapReady(true);
      });
      map.on("click", () => setSelectedKey(null));
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
      markersRef.current = {};
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const selectItem = useCallback((key) => {
    const p = pointsRef.current.find((pt) => pt.key === key);
    if (!p || !mapRef.current) return;
    setSelectedKey(key);
    mapRef.current.flyTo({
      center: [p.geo.lng, p.geo.lat],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      duration: 500,
    });
    const carouselNode = cardRefs.current[key];
    if (carouselNode) carouselNode.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const sidebarNode = sidebarRefs.current[key];
    if (sidebarNode) sidebarNode.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !maplibreRef.current) return;
    const maplibregl = maplibreRef.current;
    const map = mapRef.current;

    Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
    markersRef.current = {};
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    setSelectedKey(points[0]?.key ?? null);

    if (points.length === 0) {
      map.easeTo({ center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat], zoom: 10, duration: 0 });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    points.forEach((p) => {
      const el = createPinElement(p.color);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        selectItem(p.key);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.geo.lng, p.geo.lat])
        .addTo(map);
      markersRef.current[p.key] = { marker, el };
      bounds.extend([p.geo.lng, p.geo.lat]);
    });

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 900;
    map.fitBounds(bounds, {
      padding: { top: 60, bottom: isDesktop ? 60 : 170, left: 40, right: 40 },
      maxZoom: 15,
      duration: 0,
    });
  }, [points, mapReady, selectItem]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !maplibreRef.current) return;
    const maplibregl = maplibreRef.current;

    Object.entries(markersRef.current).forEach(([key, { el }]) => stylePin(el, key === selectedKey));

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    const selected = points.find((p) => p.key === selectedKey);
    if (selected) {
      popupRef.current = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
        anchor: "bottom",
        className: "nritya-map-popup",
      })
        .setLngLat([selected.geo.lng, selected.geo.lat])
        .setHTML(buildPopupHtml(selected))
        .addTo(mapRef.current);
      const popupEl = popupRef.current.getElement();
      if (popupEl) popupEl.style.zIndex = "10";
    }
  }, [selectedKey, points, mapReady]);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height,
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(17,24,39,0.06)",
      }}
    >
      {/* Left scrollable list (desktop md+ only) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          width: { md: "36%", lg: "30%" },
          minWidth: 300,
          maxWidth: 460,
          height: "100%",
          backgroundColor: "#fff",
          borderRight: "1px solid rgba(17,24,39,0.08)",
        }}
      >
        <Box
          sx={{
            px: 1.75,
            py: 1.4,
            borderBottom: "1px solid rgba(17,24,39,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <NearMeIcon sx={{ fontSize: 18, color: "#735EAB" }} />
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
            {points.length} {countNoun}{points.length === 1 ? "" : "s"} on map
          </Typography>
        </Box>
        {points.length > 0 ? (
          <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
            {points.map((p) => (
              <Box key={p.key} ref={(el) => (sidebarRefs.current[p.key] = el)}>
                <SidebarCard item={p} isActive={p.key === selectedKey} onClick={() => selectItem(p.key)} onEdit={onItemClick} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", p: 2, textAlign: "center", fontSize: "0.85rem" }}>
            {emptyLabel || `No ${countNoun}s with a saved location to show on map`}
          </Box>
        )}
      </Box>

      {/* Map area */}
      <Box sx={{ position: "relative", flex: 1, minWidth: 0, height: "100%" }}>
        <Box ref={containerRef} sx={{ position: "absolute", inset: 0 }} />

        {mapReady && points.length === 0 && (
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(243,244,246,0.85)",
              color: "#6b7280",
              zIndex: 10,
              p: 2,
              textAlign: "center",
            }}
          >
            {emptyLabel || `No ${countNoun}s with a saved location to show on map`}
          </Box>
        )}

        {/* Count pill (mobile only) */}
        {points.length > 0 && (
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 15,
              bgcolor: "#fff",
              borderRadius: "999px",
              px: 1.5,
              py: 0.6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <NearMeIcon sx={{ fontSize: 16, color: "#735EAB" }} />
            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#111827" }}>
              {points.length} {countNoun}{points.length === 1 ? "" : "s"}
            </Typography>
          </Box>
        )}

        {/* Bottom synced carousel (mobile only) */}
        {points.length > 0 && (
          <Box sx={{ display: { xs: "block", md: "none" }, position: "absolute", left: 0, right: 0, bottom: 12, zIndex: 15, px: 1.5 }}>
            <Box sx={{ position: "relative" }}>
              <IconButton
                onClick={() => scrollCarousel(-1)}
                size="small"
                sx={{ position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)", zIndex: 2, bgcolor: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", "&:hover": { bgcolor: "#fff" } }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Box
                ref={carouselRef}
                sx={{ display: "flex", gap: 1.25, overflowX: "auto", px: 3, py: 0.5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
              >
                {points.map((p) => (
                  <Box key={p.key} ref={(el) => (cardRefs.current[p.key] = el)} sx={{ flex: "0 0 auto", width: 300, maxWidth: "82vw" }}>
                    <SidebarCard item={p} isActive={p.key === selectedKey} onClick={() => selectItem(p.key)} onEdit={onItemClick} />
                  </Box>
                ))}
              </Box>
              <IconButton
                onClick={() => scrollCarousel(1)}
                size="small"
                sx={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", zIndex: 2, bgcolor: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", "&:hover": { bgcolor: "#fff" } }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminEntityMap;
