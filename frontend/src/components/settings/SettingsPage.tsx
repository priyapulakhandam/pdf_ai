"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { getToken, notifyProfileUpdated, setAuth } from "@/lib/auth";
import { useUser } from "@/lib/useUser";
import { cn, userInitials } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function SettingsPage() {
  const user = useUser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email);
    }
  }, [user]);

  const initials = userInitials(fullName, email);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile(fullName.trim() || null);
      const token = getToken();
      if (token) {
        setAuth(token, updated);
      }
      notifyProfileUpdated();
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? String(err.message) : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    toast.error("Account deletion requires backend support — contact support@pdfchat.app");
    setShowDeleteConfirm(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 pb-24 md:pb-8">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <p className="label-caps text-cyan/80">Settings</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-display">Workspace</h1>
      </motion.div>

      <motion.section custom={1} variants={fadeUp} initial="hidden" animate="show" className="mt-8">
        <SectionHeader icon={User} title="Profile" />
        <div className="glass-card mt-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan/40 bg-cyan/10 font-display text-xl font-bold text-cyan shadow-glow">
              {initials}
            </div>
            <div>
              <p className="font-display font-bold tracking-display">{fullName || "Your profile"}</p>
              <p className="font-mono text-[10px] text-ink-muted">{email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <GlassInput label="Full name" value={fullName} onChange={setFullName} />
            <GlassInput label="Email" value={email} onChange={() => {}} readOnly />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="glow-btn mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.section>

      <motion.section custom={2} variants={fadeUp} initial="hidden" animate="show" className="mt-8">
        <SectionHeader icon={Trash2} title="Danger Zone" accent="error" />
        <div className="mt-4 rounded-2xl border border-error/20 bg-error/5 p-6">
          <p className="text-sm text-ink-secondary">
            Permanently delete your account and all associated documents, chat sessions, and embeddings.
            This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-medium text-error transition hover:bg-error/20 active:scale-[0.97]"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white active:scale-[0.97]"
              >
                <Trash2 className="h-4 w-4" />
                Confirm deletion
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm text-ink-secondary active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  accent = "cyan",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: "cyan" | "error";
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accent === "error" ? "text-error" : "text-cyan")} />
        <p className="label-caps">{title}</p>
      </div>
      <div
        className={cn(
          "mt-2 h-px w-12",
          accent === "error" ? "bg-error/50" : "bg-cyan/50"
        )}
      />
    </div>
  );
}

function GlassInput({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="label-caps">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "focus-glow mt-2 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-ink-primary transition-colors placeholder:text-ink-muted",
          readOnly && "cursor-not-allowed opacity-60"
        )}
      />
    </div>
  );
}
