import {
  useRef,
  useState,
  useImperativeHandle,
  useEffect,
  forwardRef,
} from "react";
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

import ImageCropperDialog from "./ImageCropperDialog";

const ImageUploader = forwardRef(
  (
    {
      title = "Upload Images",
      min = 1,
      max = 5,
      baseApiUrl,
      entityId,
      isCropRequired = false,
    },
    ref
  ) => {
    const inputRef = useRef();

    const [existingImages, setExistingImages] = useState([]);
    const [removedImages, setRemovedImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
      const fetchImages = async () => {
        if (!entityId) return;
        setLoading(true);
        try {
          const res = await axios.get(
            `${baseApiUrl}api/studio/${entityId}/images/`
          );
          const urls = res.data?.StudioImages;
          setExistingImages(urls);
        } catch (err) {
          console.error("Failed to fetch existing images", err);
        } finally {
          setLoading(false);
        }
      };

      fetchImages();
    }, [entityId]);

    useImperativeHandle(ref, () => ({
      uploadImages,
    }));

    const extractFilename = (url) => {
      try {
        const path = new URL(url).pathname;
        const parts = path.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
      } catch {
        return "";
      }
    };

    const handleFileSelect = (event) => {
      const files = Array.from(event.target.files);
      const total = existingImages.length + newImages.length + files.length;

      if (total > max) {
        alert(`Maximum ${max} images allowed`);
        return;
      }

      if (isCropRequired && max === 1 && files.length === 1) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedFile(file);
          setCropImageUrl(reader.result);
          setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        const imageObjs = files.map((file) => ({
          file,
          url: URL.createObjectURL(file),
        }));
        setNewImages((prev) => [...prev, ...imageObjs]);
      }

      event.target.value = null;
    };

    const handleRemove = (index, isExisting) => {
      if (isExisting) {
        const toRemove = existingImages[index];
        setRemovedImages((prev) => [...prev, toRemove]);
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
      } else {
        const toRemove = newImages[index];
        URL.revokeObjectURL(toRemove.url);
        setNewImages((prev) => prev.filter((_, i) => i !== index));
      }
    };

    const uploadImages = async (newlyCreatedEntityId) => {
      const finalEntityId = entityId || newlyCreatedEntityId;

      if (!finalEntityId || !baseApiUrl) {
        console.warn("Upload skipped: missing entityId or baseApiUrl");
        return [];
      }

      const total = existingImages.length + newImages.length;
      if (total < min) {
        alert(`Minimum ${min} image(s) required`);
        return [];
      }

      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((img) => formData.append("images", img.file));
        formData.append("entity_id", finalEntityId);

        try {
          await axios.post(`${baseApiUrl}imagesCrud/studioImage/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.error("Image upload failed", err);
        }
      }

      for (const removedImage of removedImages) {
        try {
          const imageName = extractFilename(removedImage);
          const urlSafe = encodeURIComponent(imageName);
          await axios.delete(
            `${baseApiUrl}imagesCrud/studioImage/${finalEntityId}/${urlSafe}/`
          );
        } catch (err) {
          console.error("Failed to delete image:", removedImage, err);
        }
      }
    };

    const handleCropComplete = (croppedImage) => {
      setNewImages([{ ...croppedImage }]);
      setCropDialogOpen(false);
    };

    const totalCount = existingImages.length + newImages.length;

    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {title} ({totalCount}/{max})
        </Typography>

        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={inputRef}
          onChange={handleFileSelect}
        />

        <Button variant="outlined" onClick={() => inputRef.current.click()}>
          Choose Images
        </Button>

        {loading ? (
          <Box mt={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Grid container spacing={2} mt={2}>
            {existingImages.map((img, index) => (
              <Grid item key={`existing-${index}`}>
                <Paper
                  variant="outlined"
                  sx={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    overflow: "hidden",
                    borderRadius: 1,
                  }}
                >
                  <img
                    src={img}
                    alt={title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(index, true)}
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      bgcolor: "white",
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "white",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}

            {newImages.map((img, index) => (
              <Grid item key={`new-${index}`}>
                <Paper
                  variant="outlined"
                  sx={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    overflow: "hidden",
                    borderRadius: 1,
                  }}
                >
                  <img
                    src={img.url}
                    alt={`preview-${index}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(index, false)}
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      bgcolor: "white",
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "white",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <ImageCropperDialog
          open={cropDialogOpen}
          imageSrc={cropImageUrl}
          filename={selectedFile?.name}
          onClose={() => setCropDialogOpen(false)}
          onCropComplete={handleCropComplete}
        />
      </Box>
    );
  }
);

export default ImageUploader;
