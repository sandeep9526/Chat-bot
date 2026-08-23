import re

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

# 1. Add Code icon
content = content.replace(
    'import { ArrowRight, Sparkles, Check, ChevronRight, X, Bot, Globe, CornerRightDown, Zap, User, FileText, Palette, LogOut } from "lucide-react";',
    'import { ArrowRight, Sparkles, Check, ChevronRight, X, Bot, Globe, CornerRightDown, Zap, User, FileText, Palette, LogOut, Code } from "lucide-react";'
)

# 2. Add Studio & InstallCard imports
import_insert = """import { Studio } from "@/components/studio/Studio";
import { InstallCard } from "@/components/panel/InstallCard";"""
content = content.replace(
    'import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";',
    f'import {{ OchreshiftLogo }} from "@/components/ui/OchreshiftLogo";\n{import_insert}'
)

# 3. Update Step type
content = content.replace(
    'type Step = "intro" | "profile" | "knowledge" | "appearance";',
    'type Step = "intro" | "profile" | "knowledge" | "appearance" | "install";'
)

# 4. Update stepsList
steps_list_old = """  const stepsList = [
    { id: "intro", title: "Business", subtitle: "Step 1", icon: Globe },
    { id: "profile", title: "Profile", subtitle: "Step 2", icon: User },
    { id: "knowledge", title: "Knowledge", subtitle: "Step 3", icon: FileText },
    { id: "appearance", title: "Appearance", subtitle: "Step 4", icon: Palette }
  ];"""
steps_list_new = """  const stepsList = [
    { id: "intro", title: "Business", subtitle: "Step 1", icon: Globe },
    { id: "profile", title: "Profile", subtitle: "Step 2", icon: User },
    { id: "knowledge", title: "Knowledge", subtitle: "Step 3", icon: FileText },
    { id: "appearance", title: "Appearance", subtitle: "Step 4", icon: Palette },
    { id: "install", title: "Install", subtitle: "Step 5", icon: Code }
  ];"""
content = content.replace(steps_list_old, steps_list_new)

# 5. Update progress bar (currentStepIndex + 1) / 4 -> / 5
content = content.replace(
    '`${((currentStepIndex + 1) / 4) * 100}%`',
    '`${((currentStepIndex + 1) / 5) * 100}%`'
)

# 6. Add mockBot definition before return
mock_bot_def = """
  const mockBot: AdminBot = {
    bot_id: botId || "",
    name: name,
    accent: accent,
    welcome: welcome,
    suggestions: suggestions,
  };

  return (
"""
content = content.replace("  return (", mock_bot_def, 1)

# 7. Restructure MAIN CONTENT AREA
main_content_area = """      {/* --- MAIN CONTENT AREA --- */}
      {step === "appearance" ? (
        <div className="flex-1 flex flex-col bg-bg overflow-hidden relative">
          <div className="flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto pt-6 px-6">
            <Studio botId={botId || ""} />
          </div>
          <div className="flex items-center justify-between p-6 px-10 border-t border-border bg-surface shrink-0 z-50">
            <button
              onClick={() => setStep("knowledge")}
              className="px-6 py-2.5 rounded-[12px] text-[14px] font-[600] text-muted hover:text-fg hover:bg-panel transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("install")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[14px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20"
            >
              Next Step <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : step === "install" ? (
        <div className="flex-1 flex flex-col items-center justify-start bg-bg overflow-hidden relative p-6 pt-10">
          <div className="w-full max-w-4xl flex-1 overflow-y-auto">
            <InstallCard bot={mockBot} />
          </div>
          <div className="w-full max-w-4xl flex items-center justify-between mt-6 p-6 border-t border-border bg-surface rounded-2xl shrink-0 z-50 shadow-sm">
            <button
              onClick={() => setStep("appearance")}
              className="px-6 py-2.5 rounded-[12px] text-[14px] font-[600] text-muted hover:text-fg hover:bg-panel transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[14px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20"
            >
              Finish Setup <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">"""
content = content.replace('      {/* --- MAIN CONTENT AREA --- */}\n      <div className="flex-1 flex overflow-hidden">', main_content_area)

# 8. Close the ternary expression at the end of the file
# Find the end of the file
end_divs = """      </div>
    </div>
  );
}"""
new_end_divs = """      </div>
      )}
    </div>
  );
}"""
content = content.replace(end_divs, new_end_divs)

# 9. Remove the old Step 4 Appearance block from the Left Panel
# We need to find the block: {/* Step 4: Appearance (Brand Color) */}
# and remove it.
import re
pattern = re.compile(r'\{\s*/\*\s*Step 4: Appearance.*?\n\s*\}\)', re.DOTALL)
content = pattern.sub('', content)

# 10. Also update navigation buttons for step 3 since it doesn't need to say "Finish Setup"
nav_buttons_old = """                <button
                  type="button"
                  onClick={step === "profile" ? handleCreateBot : step === "knowledge" ? () => setStep("appearance") : handleComplete}
                  disabled={isProcessing || (step === "profile" && !name.trim())}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[14px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  {isProcessing
                    ? "Saving..."
                    : step === "appearance"
                      ? "Finish Setup"
                      : "Next Step"}
                  {!isProcessing && <ArrowRight size={16} />}
                </button>"""
nav_buttons_new = """                <button
                  type="button"
                  onClick={step === "profile" ? handleCreateBot : step === "knowledge" ? () => setStep("appearance") : handleComplete}
                  disabled={isProcessing || (step === "profile" && !name.trim())}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[14px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  {isProcessing
                    ? "Saving..."
                    : "Next Step"}
                  {!isProcessing && <ArrowRight size={16} />}
                </button>"""
content = content.replace(nav_buttons_old, nav_buttons_new)

# Also remove `{step !== "intro" && (` block for buttons if step !== "appearance" is assumed, actually no, the existing check is fine since step 4 and 5 are outside.

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)
print("Done")
