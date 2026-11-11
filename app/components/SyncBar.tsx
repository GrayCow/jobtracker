"use client";

import { useEffect, useState, useTransition } from "react";
import { triggerSync } from "@/app/actions";

type SyncStatusResponse = {
  connected: boolean;
  state: { lastSyncAt: string | null; status: string | null; lastError: string | null } | null;
};

export function SyncBar() {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshStatus = async () => {
    const res = await fetch("/api/sync");
    const data = await res.json();
    setStatus(data);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/sync")
      .then((res) => res.json())
      .then((data) => {
        if (active) setStatus(data);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSync = () => {
    startTransition(async () => {
      const result = await triggerSync();
      if ("error" in result && result.error) {
        setMessage(result.error);
      } else if ("result" in result && result.result) {
        setMessage(`Synced: ${result.result.added} new, ${result.result.skipped} skipped.`);
      }
      await refreshStatus();
    });
  };

  if (!status) return null;

  if (!status.connected) {
    return (
      <div
        className="flex items-center justify-between rounded-lg p-3 text-sm"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      >
        <span style={{ color: "var(--text-secondary)" }}>No Gmail account connected yet.</span>
        <a href="/api/auth/google" className="font-medium" style={{ color: "var(--series-applied)" }}>
          Connect Gmail
        </a>
      </div>
    );
  }

  const lastSyncAt = status.state?.lastSyncAt;

  return (
    <div
      className="flex items-center justify-between rounded-lg p-3 text-sm"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
    >
      <span style={{ color: "var(--text-secondary)" }}>
        {message ?? (lastSyncAt ? `Last synced ${new Date(lastSyncAt).toLocaleString()}` : "Not synced yet")}
      </span>
      <button
        onClick={handleSync}
        disabled={isPending}
        className="font-medium rounded px-3 py-1"
        style={{ background: "var(--series-applied)", color: "#fff", opacity: isPending ? 0.6 : 1 }}
      >
        {isPending ? "Syncing…" : "Sync now"}
      </button>
    </div>
  );
}
