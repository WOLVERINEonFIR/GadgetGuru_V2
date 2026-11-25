import { useEffect, useState } from "react";
import { getGadgetById } from "../services/api";

export function useGadget(id) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) return;

    console.log("🔥 FETCHING DEVICE:", id);

    getGadgetById(id)
      .then((res) => {
        console.log("✅ DEVICE DATA:", res);
        setData(res);
      })
      .catch((err) => {
        console.error("❌ FETCH ERROR:", err);
      });
  }, [id]);

  return { data };
}