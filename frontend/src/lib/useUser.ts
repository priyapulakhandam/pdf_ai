"use client";

import { useEffect, useState } from "react";
import { getUser } from "./auth";
import type { User } from "./types";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener("pdfchat:profile-updated", sync);
    return () => window.removeEventListener("pdfchat:profile-updated", sync);
  }, []);

  return user;
}
