
import { formatValue, getValue, NOT_AVAILABLE } from "../lib/specs";

function isMissingValue(value) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function resolveField(device, field) {
  const candidatePaths = [field.path, ...(field.fallbackPaths ?? [])];

  for (const path of candidatePaths) {
    const value = getValue(device, path);

    if (!isMissingValue(value)) {
      return { path, value };
    }
  }

  return { path: field.path, value: undefined };
}

function SpecSection({
  section,
  device,
  showTitle = true,
  className = "",
  rowsClassName = "space-y-2",
  rowClassName = "flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm",
  labelClassName = "text-slate-500",
  valueClassName = "text-right font-semibold text-slate-900",
}) {
  if (!section) return null;

  return (
    <div className={className}>
      {showTitle ? (
        <div className="mb-3 text-sm font-bold text-slate-900">
          {section.section}
        </div>
      ) : null}

      <div className={rowsClassName}>
        {section.fields.map((field) => {
          const resolved = resolveField(device, field);

          // Correct argument order for the current specs.js formatter
          const value = formatValue(resolved.value, field, device);

          return (
            <div
              key={`${section.section}-${field.label}`}
              className={rowClassName}
            >
              <span className={labelClassName}>{field.label}</span>

              <span
                className={
                  value === NOT_AVAILABLE
                    ? `${valueClassName} text-slate-400`
                    : valueClassName
                }
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SpecSection;
