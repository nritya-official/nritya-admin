import {
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRef } from "react";

const ImageUpload = ({
  title,
  existingImages = [],
  newImages = [],
  onFileAdd,
  onRemove,
  max = 5,
}) => {
  const inputRef = useRef();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageObjs = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    onFileAdd(imageObjs);
    event.target.value = null;
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {title} ({existingImages.length + newImages.length}/{max})
      </Typography>

      <input
        type="file"
        accept="image/*"
        hidden
        ref={inputRef}
        onChange={handleFileSelect}
        multiple
      />
      <Button variant="outlined" onClick={() => inputRef.current.click()}>
        Choose Images
      </Button>

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
                alt="existing"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                size="small"
                onClick={() => onRemove(index, true)}
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
                alt="new"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                size="small"
                onClick={() => onRemove(index, false)}
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
    </Box>
  );
};

export default ImageUpload;
