"use client";

import { useEffect, useState } from "react";
import { useSpring, useTransform } from "framer-motion";

export function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 18, duration: duration * 1000 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const [text, setText] = useState("0");

  useEffect(() => {
    spring.set(value);
    return display.on("change", (v) => setText(String(v)));
  }, [value, spring, display]);

  return (
    <>
      {text}
      {suffix}
    </>
  );
}
