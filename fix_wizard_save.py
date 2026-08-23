import re

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

# Add useZevaStore and stashBotDesign imports
import_store = """import { useZevaStore } from "@/stores/zevaStore";
import { stashBotDesign } from "@/lib/pendingDesign";"""

content = content.replace(
    'import { createBot, type AdminBot } from "@/lib/adminApi";',
    'import { createBot, type AdminBot } from "@/lib/adminApi";\n' + import_store
)

# Find where to add handleSaveAppearanceAndContinue
insert_func_after = """    } finally {
      setIsProcessing(false);
    }
  };"""

save_func = """

  const store = useZevaStore();

  const handleSaveAppearanceAndContinue = async () => {
    setIsProcessing(true);
    setError("");
    try {
      if (botId) {
        await createBot({
          botId,
          name: store.config.name,
          accent: store.config.accent,
          welcome: store.config.welcome,
          suggestions: store.config.suggestions.filter(s => s.trim()),
          design: { config: store.config, websiteUrl: store.websiteUrl },
        });
        stashBotDesign(botId, store.config, store.websiteUrl);
      }
      setStep("install");
    } catch (err: any) {
      setError(err.message || "Failed to save appearance");
    } finally {
      setIsProcessing(false);
    }
  };
"""

content = content.replace(insert_func_after, insert_func_after + save_func, 1)

# Update the "Next Step" button for Step 4
old_appearance_next = """            <button
              onClick={() => setStep("install")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[14px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20"
            >
              Next Step <ArrowRight size={16} />
            </button>"""

new_appearance_next = """            <button
              onClick={handleSaveAppearanceAndContinue}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[14px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {isProcessing ? "Saving..." : "Next Step"} {!isProcessing && <ArrowRight size={16} />}
            </button>"""

content = content.replace(old_appearance_next, new_appearance_next)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)

print("done")
