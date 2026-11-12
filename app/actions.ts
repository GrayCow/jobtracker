"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateApplication as updateApplicationInDb } from "@/lib/applications/service";
import { runSync } from "@/lib/gmail/sync";
import { isGmailConnected } from "@/lib/gmail/oauth";
import { setSyncMethod, setAccentTheme } from "@/lib/settings";
import type { SyncMethod, AccentTheme } from "@prisma/client";

export async function updateApplication(id: string, formData: FormData) {
  await updateApplicationInDb(id, {
    companyLinkedInUrl: (formData.get("companyLinkedInUrl") as string) || null,
    recruiterName: (formData.get("recruiterName") as string) || null,
    recruiterLinkedInUrl: (formData.get("recruiterLinkedInUrl") as string) || null,
    recruiterEmail: (formData.get("recruiterEmail") as string) || null,
    connectionNotes: (formData.get("connectionNotes") as string) || null,
  });

  revalidatePath(`/applications/${id}`);
  revalidatePath("/applications");
}

export async function chooseSyncMethod(method: SyncMethod) {
  await setSyncMethod(method);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function setTheme(theme: AccentTheme) {
  await setAccentTheme(theme);
  revalidatePath("/", "layout");
}

export async function triggerSync() {
  const connected = await isGmailConnected();
  if (!connected) {
    return { error: "No Gmail account connected yet." };
  }

  try {
    const result = await runSync();
    revalidatePath("/dashboard");
    revalidatePath("/applications");
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Sync failed." };
  }
}
