import json

def render_llm_card(specs: dict, intent: str, is_stretch: bool = False) -> str:
    lines = []
    ident = specs.get("identity", {})

    brand = ident.get('brand', '')
    model = ident.get('model_name', '')
    title = model if model.lower().startswith(brand.lower()) else f"{brand} {model}"
    if is_stretch:
        title += " [STRETCH — about 5% over budget]"
    lines.append(title.strip())

    f = specs.get("derived", {}).get("filter", {})
    if f.get("price_min_inr"):
        lines.append(f"Price: Rs.{f['price_min_inr']}")

    # ---- Performance ----
    perf = specs.get("performance", {})
    chip = perf.get("chipset", {}).get("variants", [])
    if chip:
        lines.append(f"Chipset: {chip[0].get('model')} ({chip[0].get('process_nm')}nm)")
    for b in perf.get("benchmark_results", []):
        if b.get('test_name') in ('AnTuTu', 'GeekBench'):
            lines.append(f"{b.get('test_name')} {b.get('version') or ''}: {b.get('score')}")

    # ---- Battery ----
    bat = specs.get("battery", {})
    wired_w = (bat.get("wired_charging") or {}).get("max_power_w")
    wireless_w = (bat.get("wireless_charging") or {}).get("max_power_w")
    use_min = bat.get("active_use_score_minutes")
    bat_line = f"Battery: {bat.get('capacity_mah')}mAh"
    if wired_w:
        bat_line += f", {wired_w}W wired"
    if wireless_w:
        bat_line += f", {wireless_w}W wireless"
    if use_min:
        bat_line += f", ~{use_min // 60}h{use_min % 60:02d}m active use"
    lines.append(bat_line)

    # ---- Camera ----
    cam_mods = specs.get("cameras", {}).get("modules", [])
    rear = next((m for m in cam_mods if m.get("position") == "rear"), None)
    if rear:
        lens_bits = []
        for lens in rear.get("lenses", []):
            bit = f"{lens.get('type')} {lens.get('resolution_mp')}MP"
            if lens.get("aperture"):
                bit += f" f/{lens.get('aperture')}"
            if lens.get("ois"):
                bit += " OIS"
            lens_bits.append(bit)
        if lens_bits:
            lines.append("Rear camera: " + "; ".join(lens_bits))

    # ---- Display ----
    disp = (specs.get("displays") or [{}])[0]
    disp_bits = []
    if disp.get("size_inches"):
        disp_bits.append(f"{disp.get('size_inches')}\"")
    if disp.get("refresh_rate_hz"):
        disp_bits.append(f"{disp.get('refresh_rate_hz')}Hz")
    if disp.get("peak_brightness_nits"):
        disp_bits.append(f"{disp.get('peak_brightness_nits')} nits peak")
    if disp.get("technology"):
        disp_bits.append(disp.get("technology").split(",")[0])
    if disp_bits:
        lines.append("Display: " + ", ".join(disp_bits))

    # ---- Build ----
    phys = specs.get("physical", {})
    build_bits = []
    if phys.get("weight_g"):
        build_bits.append(f"{phys.get('weight_g')}g")
    wr = (phys.get("water_resistance") or {}).get("rating")
    if wr:
        build_bits.append(wr)
    if phys.get("frame_material"):
        build_bits.append(phys.get("frame_material"))
    if build_bits:
        lines.append("Build: " + ", ".join(build_bits))

    # ---- Software ----
    sw = specs.get("software", {})
    sw_bits = []
    if sw.get("operating_system"):
        sw_bits.append(sw.get("operating_system"))
    upd = (sw.get("update_policy") or {}).get("major_os_updates")
    if upd:
        sw_bits.append(f"{upd} major OS updates")
    if sw_bits:
        lines.append("Software: " + ", ".join(sw_bits))

    return "\n".join(lines)