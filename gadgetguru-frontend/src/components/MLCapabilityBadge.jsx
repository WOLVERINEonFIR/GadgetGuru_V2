/**
 * MLCapabilityBadge.jsx
 *
 * Shows what LLM models a laptop can run locally, based on
 * RAM + GPU VRAM. Displayed on LaptopCard when intent includes
 * needs_gpu modifier, or always visible in expanded specs.
 *
 * Tiers:
 *   power_user  — 64GB+ RAM, 24GB+ VRAM  → 30B–70B models
 *   mid_range   — 32GB+ RAM, 12GB+ VRAM  → 7B–14B models
 *   starter     — 8GB–16GB RAM, <12GB    → 1B–3B quantized
 *   none        — integrated / <8GB RAM  → not suitable
 */

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ─── Tier definitions ─────────────────────────────────────────────────────────

const ML_TIERS = {
  power_user: {
    label:      'Power User',
    hardware:   '64GB+ RAM · 24GB+ VRAM',
    models:     '30B – 70B models',
    speed:      '10 – 25 tokens/sec',
    speedLabel: 'Pro',
    examples:   ['Llama 3 70B', 'Mixtral 8×22B', 'Qwen 72B'],
    color: {
      bg:     'rgba(124, 58, 237, 0.10)',
      border: 'rgba(124, 58, 237, 0.30)',
      text:   'rgb(109, 40, 217)',
      badge:  'rgba(124, 58, 237, 0.15)',
    },
  },
  mid_range: {
    label:      'Mid-Range',
    hardware:   '32GB RAM · 12GB+ VRAM',
    models:     '7B – 14B models',
    speed:      '15 – 40 tokens/sec',
    speedLabel: 'Fast',
    examples:   ['Llama 3.1 8B', 'Mistral 7B', 'Phi-3 14B'],
    color: {
      bg:     'rgba(16, 185, 129, 0.10)',
      border: 'rgba(16, 185, 129, 0.30)',
      text:   'rgb(5, 150, 105)',
      badge:  'rgba(16, 185, 129, 0.15)',
    },
  },
  starter: {
    label:      'Starter',
    hardware:   '8GB – 16GB RAM · No GPU needed',
    models:     '1B – 3B (quantized)',
    speed:      '2 – 5 tokens/sec',
    speedLabel: 'Slow',
    examples:   ['Phi-3 Mini', 'Gemma 2B', 'TinyLlama 1.1B'],
    color: {
      bg:     'rgba(245, 158, 11, 0.10)',
      border: 'rgba(245, 158, 11, 0.30)',
      text:   'rgb(180, 117, 10)',
      badge:  'rgba(245, 158, 11, 0.15)',
    },
  },
};

// ─── Tier computation (mirrors laptop_cleaner.py logic) ───────────────────────

export function computeMLTier(laptop) {
  const ram  = toNumber(
    laptop?.variants?.[0]?.ram_gb ?? laptop?.ram_gb, 0
  );
  const vram = toNumber(
    laptop?.performance?.gpu_vram_gb ?? laptop?.gpu_vram_gb, 0
  );
  const gpuType = laptop?.performance?.gpu_type ?? laptop?.gpu_type ?? 'integrated';

  if (ram >= 64 && vram >= 24 && gpuType === 'dedicated') return 'power_user';
  if (ram >= 32 && vram >= 12 && gpuType === 'dedicated') return 'mid_range';
  if (ram >= 8)  return 'starter';
  return 'none';
}

// ─── Speed bar ────────────────────────────────────────────────────────────────

function SpeedBar({ tier }) {
  const fills = { power_user: 3, mid_range: 2, starter: 1, none: 0 };
  const fill  = fills[tier] ?? 0;
  const color = ML_TIERS[tier]?.color?.text ?? '#888';

  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width:        '18px',
            height:       '6px',
            borderRadius: '3px',
            background:   i <= fill ? color : 'rgba(0,0,0,0.10)',
            transition:   'background 0.2s',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Props:
 *   laptop      — laptop document from MongoDB / recommendation engine
 *   compact     — if true, show only the tier pill (for card summary row)
 *                 if false (default), show full breakdown panel
 *   showAlways  — if false (default), hide when tier is 'none'
 */
export function MLCapabilityBadge({ laptop, compact = false, showAlways = false }) {
  const tierKey = laptop?.ml_tier ?? computeMLTier(laptop);
  const tier    = ML_TIERS[tierKey];

  if (!tier && !showAlways) return null;
  if (tierKey === 'none' && !showAlways) return null;

  // ── Compact pill — shown in card summary row ───────────────────
  if (compact) {
    return (
      <span
        title={tier ? `${tier.models} · ${tier.speed}` : 'Not suitable for local LLM'}
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '5px',
          padding:      '0.25rem 0.55rem',
          borderRadius: '999px',
          background:   tier?.color?.bg    ?? 'rgba(0,0,0,0.06)',
          border:       `1px solid ${tier?.color?.border ?? 'rgba(0,0,0,0.12)'}`,
          fontSize:     '0.76rem',
          fontWeight:   600,
          color:        tier?.color?.text  ?? 'inherit',
          whiteSpace:   'nowrap',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4"
            fill={tier?.color?.text ?? '#888'} fillOpacity="0.25"
            stroke={tier?.color?.text ?? '#888'} strokeWidth="1"
          />
          <circle cx="5" cy="5" r="2" fill={tier?.color?.text ?? '#888'} />
        </svg>
        {tier ? `ML · ${tier.label}` : 'ML · N/A'}
      </span>
    );
  }

  // ── Full panel — shown in expanded specs ───────────────────────
  if (!tier) {
    return (
      <div style={{
        padding:      '0.75rem',
        borderRadius: '8px',
        background:   'rgba(0,0,0,0.04)',
        border:       '1px solid rgba(0,0,0,0.10)',
        fontSize:     '0.82rem',
        color:        'rgba(0,0,0,0.45)',
      }}>
        Not recommended for local LLM inference. Integrated GPU or insufficient RAM.
      </div>
    );
  }

  return (
    <div style={{
      padding:      '0.85rem',
      borderRadius: '10px',
      background:   tier.color.bg,
      border:       `1px solid ${tier.color.border}`,
      marginBottom: '0.5rem',
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: tier.color.text }}>
          {tier.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SpeedBar tier={tierKey} />
          <span style={{
            fontSize:     '0.72rem',
            fontWeight:   600,
            color:        tier.color.text,
            padding:      '0.15rem 0.4rem',
            background:   tier.color.badge,
            borderRadius: '4px',
          }}>
            {tier.speedLabel}
          </span>
        </div>
      </div>

      {/* Spec table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
        {[
          { label: 'Hardware',  value: tier.hardware },
          { label: 'Models',    value: tier.models   },
          { label: 'Speed',     value: tier.speed    },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background:   'rgba(255,255,255,0.55)',
            borderRadius: '6px',
            padding:      '0.4rem 0.5rem',
          }}>
            <div style={{ fontSize: '0.68rem', opacity: 0.6, marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: tier.color.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Example models */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        <span style={{ fontSize: '0.72rem', opacity: 0.6, marginRight: '2px', alignSelf: 'center' }}>
          Can run:
        </span>
        {tier.examples.map((model) => (
          <span
            key={model}
            style={{
              fontSize:     '0.72rem',
              padding:      '0.15rem 0.45rem',
              borderRadius: '4px',
              background:   tier.color.badge,
              color:        tier.color.text,
              fontWeight:   500,
            }}
          >
            {model}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Inline summary row (for card body, always visible) ───────────────────────
// Shows: "ML Capable · Mid-Range · Llama 3.1 8B"

export function MLCapabilitySummary({ laptop }) {
  const tierKey = laptop?.ml_tier ?? computeMLTier(laptop);
  const tier    = ML_TIERS[tierKey];
  if (!tier) return null;

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '0.5rem',
      flexWrap:     'wrap',
      margin:       '0.35rem 0',
    }}>
      <MLCapabilityBadge laptop={laptop} compact />
      <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
        {tier.examples[0]}
      </span>
    </div>
  );
}

export default MLCapabilityBadge;
