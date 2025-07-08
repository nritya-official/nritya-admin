import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
} from "@mui/material";
import Cropper from "react-easy-crop";

const ImageCropperDialog = ({
  open,
  imageSrc,
  onClose,
  onCropComplete: handleFinalCrop,
  filename,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  };

  const getCroppedImg = async () => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((res) => (image.onload = res));

    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], filename, { type: "image/jpeg" });
        resolve({ file, url: URL.createObjectURL(file) });
      }, "image/jpeg");
    });
  };

  const handleCrop = async () => {
    const cropped = await getCroppedImg();
    handleFinalCrop(cropped);
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" onClose={onClose}>
      <DialogContent>
        <Box position="relative" width="100%" height={300}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            // aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
          />
        </Box>
        <Box mt={2}>
          <Typography gutterBottom>Zoom</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, z) => setZoom(z)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCrop} variant="contained">
          Crop & Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropperDialog;
