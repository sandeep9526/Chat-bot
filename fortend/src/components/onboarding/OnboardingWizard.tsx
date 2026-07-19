"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ADMIN_ENABLED } from "@/lib/adminApi";
import { StepIndicator } from "./StepIndicator";
import { StepNameBot } from "./StepNameBot";
import { StepAddDocs } from "./StepAddDocs";
import { StepEmbed } from "./StepEmbed";
import { StepDone } from "./StepDone";
import { INITIAL_WIZARD_DATA, type WizardData } from "./types";

// Branding (colour / welcome / suggestions) lives in Studio now, not here —
// onboarding stays a short path to a live bot: name → docs → embed → done.
const TOTAL_STEPS = 4;
const STEP_TITLES = [
  "Name your bot",
  "Add your documents",
  "Get your embed code",
  "Done",
];

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);

  const advance = (patch?: Partial<WizardData>) => {
    if (patch) setData((d) => ({ ...d, ...patch }));
    setStep((s) => {
      const next = Math.min(s + 1, TOTAL_STEPS);
      setFurthestStep((f) => Math.max(f, next));
      return next;
    });
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const restart = () => {
    setData(INITIAL_WIZARD_DATA);
    setStep(1);
    setFurthestStep(1);
  };

  if (!ADMIN_ENABLED) {
    return (
      <Centered>
        <p className="text-muted">
          Backend URL not configured (<code className="font-mono">NEXT_PUBLIC_API_URL</code>).
        </p>
      </Centered>
    );
  }

  if (isPending) {
    return (
      <Centered>
        <p className="text-muted">Loading…</p>
      </Centered>
    );
  }

  if (!session) {
    // Redirect is in-flight (see effect above); render nothing.
    return null;
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 py-10 max-md:px-4">
      <header className="mb-7">
        <p className="text-[11px] font-[700] uppercase tracking-[.16em] text-muted">
          Zeva Onboarding
        </p>
        <h1 className="mt-0.5 text-[26px] font-[750] tracking-[-.02em] text-fg">
          Get your bot live
        </h1>
      </header>

      <StepIndicator
        step={step}
        total={TOTAL_STEPS}
        titles={STEP_TITLES}
        furthestStep={furthestStep}
        onJump={setStep}
      />

      {step === 1 && <StepNameBot data={data} onNext={advance} />}
      {step === 2 && (
        <StepAddDocs botId={data.botId} onBack={goBack} onNext={() => advance()} />
      )}
      {step === 3 && <StepEmbed data={data} onBack={goBack} onNext={() => advance()} />}
      {step === 4 && <StepDone data={data} onRestart={restart} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-4">{children}</div>;
}
