import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Alert, Button } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

function ErrorState({ message, onRetry }) {
  const reduceMotion = useReducedMotion();

  return (
    <Alert
      component={motion.div}
      initial={reduceMotion ? false : { opacity: 0, y: -16 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      severity="error"
      icon={<ErrorOutlineRoundedIcon />}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : null
      }
      sx={{ borderRadius: 2, alignItems: "center" }}
    >
      {message}
    </Alert>
  );
}

export default ErrorState;
