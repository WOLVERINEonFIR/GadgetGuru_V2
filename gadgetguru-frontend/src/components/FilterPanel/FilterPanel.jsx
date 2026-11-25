import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

function FilterAccordion({ title, children, defaultExpanded = false }) {
  return (
    <Accordion
      disableGutters
      defaultExpanded={defaultExpanded}
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 42 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

function FilterPanel({
  activeFilterCount,
  activeBrands,
  activeRamOptions,
  activeStorageOptions,
  activeUsages,
  brand,
  budgetTiers,
  deviceType,
  maxBudget,
  minBudget,
  ramDisabledMap,
  selectedPriorities,
  selectedRam,
  selectedStorage,
  storageDisabledMap,
  strictMode,
  onApplyBudgetTier,
  onBrandChange,
  onDeviceTypeChange,
  onMaxBudgetChange,
  onMinBudgetChange,
  onReset,
  onSelectedRamChange,
  onSelectedStorageChange,
  onStrictModeChange,
  onSubmit,
  onUsageChange,
}) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const shownBrands = showAllBrands ? activeBrands : activeBrands.slice(0, 6);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 3,
        p: 2,
      }}
    >
      {/* === FILTER HEADER === */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          <Badge badgeContent={activeFilterCount} color="primary" />
        </Stack>
        <IconButton size="small" aria-label="Tune filters">
          <TuneIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* === FILTER GROUPS === */}
      <FilterAccordion title="Category" defaultExpanded>
        <FormGroup>
          {[
            { value: "phone", label: "Phones", count: deviceType === "phone" ? 1 : 0 },
            { value: "laptop", label: "Laptops", count: deviceType === "laptop" ? 1 : 0 },
          ].map((item) => (
            <FormControlLabel
              key={item.value}
              control={
                <Checkbox
                  size="small"
                  color="primary"
                  checked={deviceType === item.value}
                  onChange={() => onDeviceTypeChange(item.value)}
                />
              }
              label={
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    ({item.count})
                  </Typography>
                </Stack>
              }
            />
          ))}
        </FormGroup>
      </FilterAccordion>

      <FilterAccordion title="Brand" defaultExpanded>
        <FormGroup>
          {shownBrands.map((item) => (
            <FormControlLabel
              key={item || "Any"}
              control={
                <Checkbox
                  size="small"
                  color="primary"
                  checked={brand === item}
                  onChange={() => onBrandChange(item)}
                />
              }
              label={
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="body2">{item || "Any brand"}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    ({item ? 1 : activeBrands.length - 1})
                  </Typography>
                </Stack>
              }
            />
          ))}
        </FormGroup>
        {activeBrands.length > 6 ? (
          <Button type="button" variant="text" size="small" onClick={() => setShowAllBrands((value) => !value)}>
            {showAllBrands ? "Show less" : "Show more"}
          </Button>
        ) : null}
      </FilterAccordion>

      <FilterAccordion title="Price range">
        <Stack spacing={1.5}>
          <Slider
            value={[minBudget, maxBudget]}
            min={10000}
            max={250000}
            step={1000}
            valueLabelDisplay="auto"
            disableSwap
            onChange={(_, value) => {
              onMinBudgetChange(value[0]);
              onMaxBudgetChange(value[1]);
            }}
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="Min"
              size="small"
              type="number"
              value={minBudget}
              onChange={(event) => onMinBudgetChange(event.target.value)}
              fullWidth
            />
            <TextField
              label="Max"
              size="small"
              type="number"
              value={maxBudget}
              onChange={(event) => onMaxBudgetChange(event.target.value)}
              fullWidth
            />
          </Stack>
          <Grid container spacing={1}>
            {budgetTiers.map((tier) => (
              <Grid size={{ xs: 6 }} key={tier.label}>
                <Chip
                  label={tier.label}
                  size="small"
                  variant={minBudget === tier.min && maxBudget === tier.max ? "filled" : "outlined"}
                  color={minBudget === tier.min && maxBudget === tier.max ? "primary" : "default"}
                  onClick={() => onApplyBudgetTier(tier)}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </FilterAccordion>

      <FilterAccordion title="Rating">
        <Stack direction="row" spacing={0.5}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <IconButton key={rating} size="small" onClick={() => onUsageChange(activeUsages[Math.min(rating - 1, activeUsages.length - 1)])}>
              {rating <= Math.max(1, activeUsages.indexOf(selectedPriorities[0]) + 1) ? (
                <StarIcon fontSize="small" sx={{ color: "warning.main" }} />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          ))}
        </Stack>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <FormLabel sx={{ mb: 0.5 }}>Preference</FormLabel>
          <RadioGroup value={selectedPriorities[0]} onChange={(event) => onUsageChange(event.target.value)}>
            {activeUsages.map((usage) => (
              <FormControlLabel
                key={usage}
                value={usage}
                control={<Radio size="small" />}
                label={usage[0].toUpperCase() + usage.slice(1)}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </FilterAccordion>

      <FilterAccordion title="Sort by">
        <Stack spacing={1.5}>
          <Select size="small" fullWidth value="relevance" onChange={() => {}}>
            <MenuItem value="relevance">Relevance</MenuItem>
            <MenuItem value="price-low">Price: Low to High</MenuItem>
            <MenuItem value="price-high">Price: High to Low</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="newest">Newest</MenuItem>
          </Select>
          <ToggleButtonGroup exclusive value={selectedRam} color="primary" sx={{ flexWrap: "wrap", gap: 1 }}>
            {activeRamOptions.map((ramValue) => (
              <ToggleButton
                key={ramValue}
                value={ramValue}
                onClick={() => onSelectedRamChange(ramValue)}
                disabled={ramDisabledMap[ramValue]}
                size="small"
              >
                {ramValue === 0 ? "Any RAM" : `${ramValue} GB`}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value={selectedStorage} color="primary" sx={{ flexWrap: "wrap", gap: 1 }}>
            {activeStorageOptions.map((storageValue) => (
              <ToggleButton
                key={storageValue}
                value={storageValue}
                onClick={() => onSelectedStorageChange(storageValue)}
                disabled={storageDisabledMap[storageValue]}
                size="small"
              >
                {storageValue === 0 ? "Any" : storageValue === 1024 ? "1 TB" : `${storageValue} GB`}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Select size="small" fullWidth value={strictMode ? "strict" : "flex"} onChange={(event) => onStrictModeChange(event.target.value === "strict")}>
            <MenuItem value="strict">Strict budget</MenuItem>
            <MenuItem value="flex">Flexible budget</MenuItem>
          </Select>
        </Stack>
      </FilterAccordion>

      {/* === FILTER FOOTER === */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button type="button" variant="contained" size="small" fullWidth onClick={onSubmit}>
          Apply
        </Button>
        <Button type="button" variant="outlined" size="small" fullWidth onClick={onReset}>
          Reset
        </Button>
      </Stack>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
        {brand ? <Chip size="small" label={brand} onDelete={() => onBrandChange("")} deleteIcon={<CloseIcon />} variant="outlined" /> : null}
        {selectedRam > 0 ? <Chip size="small" label={`${selectedRam} GB RAM`} onDelete={() => onSelectedRamChange(0)} deleteIcon={<CloseIcon />} variant="outlined" /> : null}
        {selectedStorage > 0 ? (
          <Chip size="small" label={selectedStorage === 1024 ? "1 TB storage" : `${selectedStorage} GB storage`} onDelete={() => onSelectedStorageChange(0)} deleteIcon={<CloseIcon />} variant="outlined" />
        ) : null}
      </Box>
    </Paper>
  );
}

export default FilterPanel;
