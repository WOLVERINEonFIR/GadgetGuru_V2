"""
Intent-aware heuristic scoring over v2.1 phone specs.

Reads specs directly from the v2.1 JSONB shape (specs.cameras.modules,
specs.displays[0], specs.battery.*, etc.). Returns six 0-100 sub-scores
per phone. Higher = better.

Design notes:
- Sub-scores are 0-100 and comparable across phones.
- Thresholds are anchored to the actual spec range in the catalog so
  flagships cluster at 85-95 and budget phones at 30-50.
- Missing fields fall back to neutral mid-range values, not zeros,
  so a phone with unknown camera doesn't get ranked last automatically.
"""

import math
import re


# ============================================================
# Math helpers
# ============================================================

def _to_float(value, default=None):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    if isinstance(value, str):
        m = re.search(r"(\d+(?:\.\d+)?)", value.replace(",", ""))
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                return default
    return default


def _max_numeric(values):
    nums = []
    for v in values or []:
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            nums.append(float(v))
    return max(nums) if nums else None


def _sensor_fraction(sensor_size):
    """'1/1.56' -> 0.641 (larger = bigger sensor = better)."""
    text = str(sensor_size or "").strip()
    m = re.search(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)", text)
    if not m:
        return None
    num = _to_float(m.group(1))
    den = _to_float(m.group(2))
    if not num or not den:
        return None
    return num / den


def clamp_score(value, low=0, high=100):
    if value is None:
        return low
    try:
        value = float(value)
    except (TypeError, ValueError):
        return low
    if math.isnan(value):
        return low
    return max(low, min(high, int(round(value))))


# ============================================================
# Chipset / GPU tier derivation
# ============================================================

def derive_chipset_tier(chipset_name):
    text = (chipset_name or "").lower()
    if not text:
        return None

    if "tensor g" in text:
        return "flagship"

    if re.search(r"\bapple\s*m\d\b", text):
        return "ultimate"
    if re.search(r"\bapple\s*a(18|19|20)\b", text):
        return "ultimate"
    if re.search(r"\bapple\s*a(16|17)\b", text):
        return "flagship"
    if re.search(r"\bapple\s*a(14|15)\b", text):
        return "upper_mid"
    if re.search(r"\bapple\s*a(12|13)\b", text):
        return "midrange"

    if "snapdragon" in text:
        if re.search(r"8\s*elite", text):
            return "ultimate"
        if re.search(r"snapdragon\s*8", text):
            return "flagship"
        if re.search(r"snapdragon\s*8s", text):
            return "upper_mid"
        if re.search(r"snapdragon\s*7\+", text):
            return "upper_mid"
        if re.search(r"snapdragon\s*7", text):
            return "midrange"
        if re.search(r"snapdragon\s*6", text):
            return "budget_mid"
        if re.search(r"snapdragon\s*4", text):
            return "budget"
        if re.search(r"(870|865|860|855)", text):
            return "flagship"
        if re.search(r"(778|780|782)", text):
            return "upper_mid"
        if re.search(r"(695|690)", text):
            return "midrange"

    if "dimensity" in text:
        if re.search(r"9[4-9]00", text):
            return "ultimate"
        if re.search(r"9[0-3]00", text):
            return "flagship"
        if re.search(r"8[0-3]00", text):
            return "upper_mid"
        if re.search(r"7[2-3]00", text):
            return "midrange"
        if re.search(r"7050", text):
            return "midrange"
        if re.search(r"6[0-1]00", text):
            return "budget_mid"
        if re.search(r"6000", text):
            return "budget"

    if "exynos" in text:
        if re.search(r"(2400|2300|2200|2100)", text):
            return "flagship"
        if re.search(r"1480", text):
            return "upper_mid"
        if re.search(r"(1380|1280)", text):
            return "midrange"
        if re.search(r"(9611|9610)", text):
            return "midrange"
        if re.search(r"850", text):
            return "budget"

    return None


GPU_TIER_MAP = {
    "adreno 840": "ultimate",
    "adreno 830": "ultimate",
    "immortalis-g925": "ultimate",
    "xclipse 950": "ultimate",

    "adreno 750": "flagship",
    "adreno 740": "flagship",
    "immortalis-g720": "flagship",
    "mali-g715": "flagship",
    "mali-g710": "flagship",
    "xclipse 940": "flagship",
    "apple gpu": "ultimate",

    "adreno 829": "upper_mid",
    "adreno 825": "upper_mid",
    "adreno 735": "upper_mid",
    "adreno 732": "upper_mid",
    "adreno 730": "upper_mid",
    "mali-g720": "upper_mid",
    "mali-g615": "upper_mid",
    "xclipse 920": "upper_mid",

    "adreno 722": "midrange",
    "adreno 720": "midrange",
    "adreno 710": "midrange",
    "adreno 650": "midrange",
    "adreno 660": "midrange",
    "mali-g610": "midrange",
    "mali-g68": "midrange",
    "mali-g57": "midrange",
}


def derive_gpu_tier(gpu_name, fallback=None):
    if not gpu_name:
        return fallback or "midrange"
    gpu_lower = str(gpu_name).lower()
    gpu_lower = re.sub(r"\bmc\d+\b", "", gpu_lower).strip()
    if "apple gpu" in gpu_lower:
        return "ultimate"
    for key, tier in GPU_TIER_MAP.items():
        if key in gpu_lower:
            return tier
    return fallback or "midrange"


# ============================================================
# Extractors from v2.1 specs
# ============================================================

def _get_chipset(specs):
    variants = (specs.get("performance", {}).get("chipset", {}) or {}).get("variants", [])
    if not variants:
        return None, None
    v = variants[0]
    return v.get("model"), v.get("process_nm")


def _get_gpu(specs):
    variants = (specs.get("performance", {}).get("gpu", {}) or {}).get("variants", [])
    if not variants:
        return None
    return variants[0].get("model")


def _get_max_ram(specs):
    ram_options = (specs.get("derived", {}).get("filter", {}) or {}).get("ram_options_gb")
    if ram_options:
        return _max_numeric(ram_options)
    variants = specs.get("variants", []) or []
    ram = _max_numeric([v.get("ram_gb") for v in variants])
    return ram


def _get_storage_type(specs):
    mem = specs.get("memory", {}) or {}
    std = mem.get("storage_standard") or {}
    return std.get("raw") or mem.get("storage_type")


def _get_rear_lenses(specs):
    modules = (specs.get("cameras", {}) or {}).get("modules", []) or []
    for mod in modules:
        if (mod.get("position") or "").lower() == "rear":
            return mod.get("lenses", []) or [], mod
    return [], {}


def _get_primary_display(specs):
    displays = specs.get("displays", []) or []
    for d in displays:
        if (d.get("role") or "").lower() == "main":
            return d
    return displays[0] if displays else {}


# ============================================================
# Sub-scorers — each returns 0-100
# ============================================================

def _score_performance(specs):
    """Chipset + GPU + RAM. No refresh/storage (those are 'gaming')."""
    score = 0
    chipset, process_nm = _get_chipset(specs)
    chipset_tier = derive_chipset_tier(chipset)
    score += {
        "ultimate": 45,
        "flagship": 40,
        "upper_mid": 32,
        "midrange": 25,
        "budget_mid": 18,
        "budget": 10,
    }.get(chipset_tier, 10)

    gpu_tier = derive_gpu_tier(_get_gpu(specs), fallback=chipset_tier)
    score += {
        "ultimate": 30,
        "flagship": 25,
        "upper_mid": 18,
        "midrange": 12,
        "budget": 5,
    }.get(gpu_tier, 5)

    ram = _get_max_ram(specs)
    if ram is not None:
        if ram >= 16:
            score += 25
        elif ram >= 12:
            score += 20
        elif ram >= 8:
            score += 14
        elif ram >= 6:
            score += 8
        else:
            score += 4

        net = str((specs.get("connectivity") or {}).get("network_technology") or "")
        if net and "5g" not in net.lower():
            score -= 6

    return clamp_score(score)


def _score_gaming(specs):
    """Performance + refresh rate + storage speed."""
    score = _score_performance(specs) * 0.70  # 70% weight on base perf

    disp = _get_primary_display(specs)
    refresh = _to_float(disp.get("refresh_rate_hz")) or 0
    if refresh >= 144:
        score += 18
    elif refresh >= 120:
        score += 15
    elif refresh >= 90:
        score += 9

    storage = (_get_storage_type(specs) or "").lower()
    if "nvme" in storage:
        score += 12
    elif "ufs 4" in storage:
        score += 11
    elif "ufs 3" in storage:
        score += 7
    elif "ufs" in storage:
        score += 4

    return clamp_score(score)


def _score_camera(specs):
    """Main sensor + ISP/chipset tier + OIS + lens variety + video/selfie."""
    lenses, rear_module = _get_rear_lenses(specs)
    if not lenses:
        return 0

    main_mp = 0
    best_fraction = 0
    has_ultrawide = False
    has_tele = False
    has_periscope = False
    tele_ois = False

    for lens in lenses:
        if not isinstance(lens, dict):
            continue
        mp = _to_float(lens.get("resolution_mp")) or 0
        if mp > main_mp:
            main_mp = mp
        frac = _sensor_fraction(lens.get("sensor_size"))
        if frac and frac > best_fraction:
            best_fraction = frac
        ltype = str(lens.get("type") or "").lower()
        if "ultra" in ltype:
            has_ultrawide = True
        if "periscope" in ltype:
            has_periscope = True
            if lens.get("ois") is True:
                tele_ois = True
        elif "telephoto" in ltype:
            has_tele = True
            if lens.get("ois") is True:
                tele_ois = True

    score = 0

    # 1. Main sensor MP (max 22)
    if main_mp >= 200:
        score += 22
    elif main_mp >= 108:
        score += 19
    elif main_mp >= 48:
        score += 17
    elif main_mp >= 12:
        score += 13

    # 2. Sensor size with flagship fallback when OEM omits spec (max 18)
    chipset, _ = _get_chipset(specs)
    chip_tier = derive_chipset_tier(chipset)
    if best_fraction >= (1 / 1.3):
        score += 18
    elif best_fraction >= (1 / 1.5):
        score += 15
    elif best_fraction >= (1 / 1.7):
        score += 12
    elif best_fraction > 0:
        score += 8
    else:
        # Fallback for Apple/Samsung/Google when sensor_size is omitted
        score += 14 if chip_tier in ("ultimate", "flagship") else 8

    # 3. ISP / Computational Photography proxy via chipset tier (max 18)
    score += {
        "ultimate": 18,
        "flagship": 16,
        "upper_mid": 11,
        "midrange": 7,
    }.get(chip_tier, 5)

    # 4. OIS (main + bonus for stabilized telephoto) (max 18)
    any_ois = (
        (specs.get("cameras", {}) or {}).get("overall_ois_claim") is True
        or any(l.get("ois") is True for l in lenses)
    )
    if any_ois:
        score += 14
    if tele_ois:
        score += 4

    # 5. Lens variety — mutually exclusive tele vs periscope (max 24)
    if has_ultrawide:
        score += 7
    if has_periscope:
        score += 14
    elif has_tele:
        score += 11
    # Bonus if rear module supports 4K60+ video
    video_str = str((specs.get("cameras", {}) or {}).get("rear_video") or "").lower()
    if "4k@60" in video_str or "4k 60" in video_str or "8k" in video_str:
        score += 3

    return clamp_score(score)



def _score_display(specs):
    """Refresh + panel tech + brightness + PPI."""
    disp = _get_primary_display(specs)
    score = 0

    refresh = _to_float(disp.get("refresh_rate_hz")) or 0
    if refresh >= 144:
        score += 22
    elif refresh >= 120:
        score += 18
    elif refresh >= 90:
        score += 10
    elif refresh >= 60:
        score += 4

    tech = str(disp.get("technology") or "").lower()
    if "ltpo" in tech:
        score += 22
    elif "amoled" in tech or "oled" in tech:
        score += 16
    elif "ips" in tech:
        score += 7
    elif "lcd" in tech:
        score += 5

    brightness = (
        _to_float(disp.get("peak_brightness_nits"))
        or _to_float(disp.get("hbm_brightness_nits"))
        or _to_float(disp.get("typical_brightness_nits"))
        or _to_float(disp.get("measured_brightness_nits"))
        or 0
    )
    if brightness >= 2500:
        score += 20
    elif brightness >= 1800:
        score += 16
    elif brightness >= 1200:
        score += 12
    elif brightness >= 800:
        score += 7
    elif brightness >= 500:
        score += 4

    ppi = _to_float(disp.get("ppi")) or _to_float(disp.get("ppi_calculated")) or 0
    if ppi >= 500:
        score += 16
    elif ppi >= 450:
        score += 14
    elif ppi >= 400:
        score += 11
    elif ppi >= 350:
        score += 7
    elif ppi >= 300:
        score += 4

    hdr = disp.get("hdr_formats") or []
    hdr_text = " ".join(str(h) for h in hdr).lower()
    if "dolby" in hdr_text:
        score += 8
    if "hdr10+" in hdr_text or "hdr10" in hdr_text:
        score += 5

    return clamp_score(score)


def _score_battery(specs):
    """
    Capacity + active use + charging + wireless + reverse.

    Weights favor high-coverage fields:
    - capacity_mah: 100% coverage → max 34 points
    - wired_charging: 94% coverage → max 28 points
    - active_use_score_minutes: 46% coverage → max 14 points
    - wireless: 64% coverage → max 12 points
    - reverse: varies → max 4 points

    Phones missing active_use are not penalized as heavily as before.
    """
    bat = specs.get("battery", {}) or {}
    score = 0

    # Capacity — 100% coverage, primary signal
    capacity = _to_float(bat.get("capacity_mah")) or 0
    if capacity >= 7000:
        score += 34
    elif capacity >= 6000:
        score += 30
    elif capacity >= 5500:
        score += 26
    elif capacity >= 5000:
        score += 22
    elif capacity >= 4500:
        score += 16
    elif capacity >= 4000:
        score += 10
    elif capacity >= 3500:
        score += 5

    # Wired charging — 94% coverage, strong differentiator
    wired = _to_float((bat.get("wired_charging") or {}).get("max_power_w")) or 0
    if wired >= 120:
        score += 28
    elif wired >= 90:
        score += 24
    elif wired >= 65:
        score += 20
    elif wired >= 45:
        score += 15
    elif wired >= 33:
        score += 11
    elif wired >= 25:
        score += 7
    elif wired >= 18:
        score += 4

    # Active use — 46% coverage, reduced weight
    use_min = _to_float(bat.get("active_use_score_minutes"))
    if use_min:
        hours = use_min / 60
        if hours >= 18:
            score += 14
        elif hours >= 15:
            score += 12
        elif hours >= 13:
            score += 9
        elif hours >= 11:
            score += 6
        elif hours >= 9:
            score += 3

    # Wireless charging
    wireless = _to_float((bat.get("wireless_charging") or {}).get("max_power_w")) or 0
    if wireless >= 20:
        score += 12
    elif wireless > 0:
        score += 7

    # Reverse wireless
    if (bat.get("reverse_charging") or {}).get("wireless_supported"):
        score += 4

    return clamp_score(score)


def _score_build(specs):
    """Weight + IP rating + premium materials + screen protection (100-pt scale)."""
    phys = specs.get("physical", {}) or {}
    score = 0

    # 1. Weight (max 30)
    weight = _to_float(phys.get("weight_g"))
    if weight is not None:
        if weight <= 170: score += 30
        elif weight <= 185: score += 25
        elif weight <= 200: score += 18
        elif weight <= 220: score += 10
        elif weight <= 240: score += 4

    # 2. IP Rating (max 35)
    ip = str(((phys.get("water_resistance") or {}).get("rating")) or "").upper()
    if ip.startswith("IP68") or ip.startswith("IP69"): score += 35
    elif ip.startswith("IP67"): score += 28
    elif ip.startswith("IP66"): score += 22
    elif ip.startswith("IP65"): score += 16
    elif ip.startswith("IP54") or ip.startswith("IP53"): score += 10
    elif ip.startswith("IP52") or ip.startswith("IPX"): score += 5

    # 3. Chassis Materials (max 22)
    mats = phys.get("materials", {}) or {}
    front = str(mats.get("front_material") or "").lower()
    back = str(mats.get("back_material") or "").lower()
    frame = str(mats.get("frame_material") or "").lower()
    if "glass" in front and "glass" in back and any(m in frame for m in ("aluminum", "titanium", "metal")):
        score += 22
    elif "glass" in back or "titanium" in back or "ceramic" in back:
        score += 15
    elif "aluminum" in frame or "metal" in frame:
        score += 9

    # 4. Flagship Display Glass Protection (max 13)
    if any(k in front for k in ("armor", "ceramic shield", "victus", "dragon crystal", "shield glass")):
        score += 13
    elif "gorilla" in front:
        score += 7

    return clamp_score(score)



def _score_software(specs):
    policy = (specs.get("software", {}) or {}).get("update_policy", {}) or {}
    years = _to_float(policy.get("major_os_updates"))

    if years is None:
        brand = str((specs.get("identity", {}) or {}).get("brand", "")).lower()
        if "apple" in brand:
            years = 7
        elif any(b in brand for b in ("samsung", "google")):
            years = 7
        elif any(b in brand for b in ("oneplus", "oppo", "xiaomi", "vivo", "realme", "honor")):
            years = 4
        else:
            years = 3

    if years >= 7: return 100
    if years >= 5: return 88
    if years >= 4: return 78
    if years >= 3: return 62
    if years >= 2: return 52
    return 25


# ============================================================
# Aggregate + rank
# ============================================================

def compute_phone_scores_v2(specs):
    return {
        "performance": _score_performance(specs),
        "gaming": _score_gaming(specs),
        "camera": _score_camera(specs),
        "display": _score_display(specs),
        "battery": _score_battery(specs),
        "build": _score_build(specs),
        "software": _score_software(specs),
    }


# Per-intent weights over the six sub-scores. Each row sums to ~1.0.
INTENT_WEIGHTS = {
    "performance_gaming": {"performance": 0.45, "gaming": 0.30, "display": 0.10, "battery": 0.10, "build": 0.05, "software": 0.00, "camera": 0.00},
    "camera_creation":    {"performance": 0.08, "gaming": 0.00, "camera": 0.65, "display": 0.12, "battery": 0.05, "build": 0.05, "software": 0.05},
    "battery_endurance":  {"performance": 0.05, "gaming": 0.00, "camera": 0.00, "display": 0.10, "battery": 0.75, "build": 0.05, "software": 0.05},
    "everyday_value":     {"performance": 0.18, "gaming": 0.02, "camera": 0.20,"display": 0.20, "battery": 0.15, "build": 0.10, "software": 0.15},
    "media_productivity": {"performance": 0.10, "gaming": 0.00, "camera": 0.05, "display": 0.55, "battery": 0.20, "build": 0.05, "software": 0.05},
    "design_durability":  {"performance": 0.05, "gaming": 0.00, "camera": 0.05, "display": 0.10, "battery": 0.05, "build": 0.65, "software": 0.10},
}


def score_phone_v2(specs, intent):
    scores = compute_phone_scores_v2(specs)
    weights = INTENT_WEIGHTS.get(intent) or INTENT_WEIGHTS["everyday_value"]
    total = 0.0
    for key, w in weights.items():
        total += scores.get(key, 0) * w
    return round(total, 1), scores


def score_and_rank(phones, intent, top_n=20, price_max=None):
    """
    Score each phone by intent, sort desc, return top_n.
    `phones` is a list of dicts with at least {id, specs, price_min_inr, ...}.
    Returns the same dicts with 'score' and 'scores' fields added.
    """
    if not phones:
        return []

    budget_ceiling = price_max or max(
        (_to_float(p.get("price_min_inr")) or 0) for p in phones
    )

    scored = []
    for p in phones:
        specs = p.get("specs") or {}
        total, subs = score_phone_v2(specs, intent)

        # 1. Proportional price-efficiency boost for everyday_value (works across all budget tiers)
        if intent == "everyday_value" and budget_ceiling > 0:
            price = _to_float(p.get("price_min_inr")) or budget_ceiling
            headroom = max(0.0, min(1.0, (budget_ceiling - price) / budget_ceiling))
            total = round(min(100.0, total * (1.0 + headroom * 0.10)), 1)

        # 2. Screen-size adjustment for media_productivity
        if intent == "media_productivity":
            disp = (specs.get("displays") or [{}])[0]
            inches = _to_float(disp.get("size_inches")) or 0
            if inches >= 6.7:
                total = round(min(100.0, total + 3.0), 1)
            elif 0 < inches < 6.45:
                total = round(max(0.0, total - 4.0), 1)


        # Append AFTER all adjustments to `total` are finished
        enriched = {**p, "score": total, "scores": subs}
        scored.append(enriched)

    scored.sort(key=lambda x: (-x["score"], _to_float(x.get("price_min_inr")) or 0))
    return scored[:top_n]
