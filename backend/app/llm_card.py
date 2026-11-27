def render_llm_card(
    specs: dict,
    intent: str,
    score: float | None = None,
    tags: list[str] | None = None,
    rag_summary: dict | None = None,
    is_stretch: bool = False,
) -> str:
    lines = []
    ident = specs.get("identity", {})

    brand = ident.get("brand", "")
    model = ident.get("model_name", "")
    title = model if model.lower().startswith(brand.lower()) else f"{brand} {model}"
    if is_stretch:
        title += " [STRETCH — ~5% over budget]"
    lines.append(f"### {title.strip()}")

    # ---- Score, Price & Archetype Tags ----
    meta_bits = []
    f = specs.get("derived", {}).get("filter", {})
    if f.get("price_min_inr"):
        meta_bits.append(f"Price: Rs.{f['price_min_inr']:,}")
    if score is not None:
        meta_bits.append(f"Intent Score ({intent}): {score}/100")
    if meta_bits:
        lines.append(" | ".join(meta_bits))
    if tags:
        lines.append("Strength Profile: " + ", ".join(tags))

    # ---- Performance & Memory ----
    perf = specs.get("performance", {})
    chip = perf.get("chipset", {}).get("variants", [])
    perf_bits = []
    if chip:
        perf_bits.append(f"{chip[0].get('model')} ({chip[0].get('process_nm')}nm)")
    mem = specs.get("memory", {})
    if mem.get("ram_gb_options") or mem.get("storage_gb_options"):
        ram_opt = mem.get("ram_gb_options") or []
        sto_opt = mem.get("storage_gb_options") or []
        if ram_opt and sto_opt:
            perf_bits.append(f"Base {min(ram_opt)}GB/{min(sto_opt)}GB")
    if perf_bits:
        lines.append("Performance: " + " | ".join(perf_bits))

    bench_bits = [
        f"{b.get('test_name')} {b.get('version') or ''}: {b.get('score')}".strip()
        for b in perf.get("benchmark_results", [])
        if b.get("test_name") in ("AnTuTu", "GeekBench")
    ]
    if bench_bits:
        lines.append("Benchmarks: " + " | ".join(bench_bits))

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
    cams = specs.get("cameras", {})
    cam_mods = cams.get("modules", [])
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
            cam_line = "Rear camera: " + "; ".join(lens_bits)
            if intent == "camera_creation" and cams.get("rear_video"):
                cam_line += f" | Video: {cams.get('rear_video')}"
            lines.append(cam_line)

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

    # ---- Build (handles both flat and nested materials dict) ----
    phys = specs.get("physical", {})
    mats = phys.get("materials") or {}
    build_bits = []
    if phys.get("weight_g"):
        build_bits.append(f"{phys.get('weight_g')}g")
    wr = (phys.get("water_resistance") or {}).get("rating")
    if wr:
        build_bits.append(wr)
    frame = phys.get("frame_material") or mats.get("frame_material")
    if frame:
        build_bits.append(frame)
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

    # ---- RAG Review Context (Phase 2 — commented out) ----
    # if rag_summary:
    #     if rag_summary.get("pros"):
    #         lines.append("Reviewer Pros: " + "; ".join(rag_summary["pros"]))
    #     if rag_summary.get("cons"):
    #         lines.append("Reviewer Cons: " + "; ".join(rag_summary["cons"]))
    #     if rag_summary.get("verdict"):
    #         lines.append("Review Verdict: " + rag_summary["verdict"])

    return "\n".join(lines)