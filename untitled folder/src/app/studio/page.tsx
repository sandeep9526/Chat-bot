import { redirect } from "next/navigation";

// Studio now lives inside the operator dashboard (Appearance tab) instead of
// its own standalone page — this route only exists so old links keep working.
export default async function StudioPage() {
  redirect("/dashboard#appearance");
}
