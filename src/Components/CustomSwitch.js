import { Box } from "@mui/material";
import { useContext } from "react";
import AuthContext from "../context/AuthProvider";

const CustomSwitch = ({ isOn, handleToggle }) => {
  const { darkMode } = useContext(AuthContext);

  return (
    <Box
      onClick={handleToggle}
      style={{
        width: "40px",
        height: "20px",
        borderRadius: "10px",
        backgroundColor: isOn ? "#f44336" : darkMode ? "#555" : "#ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: isOn ? "flex-end" : "flex-start",
        padding: "2px",
        cursor: "pointer",
        transition: "background-color 0.3s",
      }}
    >
      <Box
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "transform 0.3s",
        }}
      />
    </Box>
  );
};

export default CustomSwitch;
