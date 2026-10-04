"use client";
// Hand-offs from other Via65 apps (e.g. Ritual): /open?from=morning&activity=gratitude&return=<url>.
// Remember where to send the person back, then open "Add gratitude" (sign-in first if needed).
import { useEffect } from "react";
import { saveEcosystemReturn } from "@/lib/ecosystem";

export default function OpenPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    saveEcosystemReturn(params.get("from"), params.get("return"));
    window.location.replace("/?compose=1");
  }, []);
  return null;
}
