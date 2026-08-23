import { LogoLoader } from "@/components/ui/PageLoader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
      <LogoLoader />
    </div>
  );
}
