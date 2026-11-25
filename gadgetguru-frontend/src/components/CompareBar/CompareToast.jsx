import { useCallback, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { CompareContext, MAX_COMPARE_DEVICES } from "../context/CompareContext";

function CompareToast() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const showToast = useCallback((msg) => {
    setMessage(msg);
    setOpen(true);
  }, []);

  const handleClose = useCallback((_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity="warning" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default CompareToast;
