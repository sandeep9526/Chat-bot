import re

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

# Add handleGoToAppearance
insert_func_after = """    } finally {
      setIsProcessing(false);
    }
  };"""

sync_func = """

  const handleGoToAppearance = () => {
    store.setBotId(botId || "");
    store.setName(name);
    store.setWelcome(welcome);
    store.setSuggestions(suggestions);
    store.setAccent(accent);
    if (websiteUrl) {
      store.setWebsiteUrl(websiteUrl);
    }
    setStep("appearance");
  };
"""

# Replace the click handler for step 3 next button
old_button = """                  onClick={step === "profile" ? handleCreateBot : step === "knowledge" ? () => setStep("appearance") : handleComplete}"""
new_button = """                  onClick={step === "profile" ? handleCreateBot : step === "knowledge" ? handleGoToAppearance : handleComplete}"""

content = content.replace(insert_func_after, insert_func_after + sync_func, 1)
content = content.replace(old_button, new_button)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)

print("done")
