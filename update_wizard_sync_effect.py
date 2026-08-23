import re

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

# Find the store initialization
store_init = "const store = useZevaStore();"

# Add useEffect after it
sync_effect = """
  useEffect(() => {
    if (step === "appearance" && isLoaded) {
      store.setBotId(botId || "");
      if (name) store.setName(name);
      if (welcome) store.setWelcome(welcome);
      if (suggestions && suggestions.length > 0) store.setSuggestions(suggestions);
      if (accent) store.setAccent(accent);
      if (websiteUrl) store.setWebsiteUrl(websiteUrl);
    }
  }, [step, isLoaded]);
"""

if "if (step === \"appearance\" && isLoaded)" not in content:
    content = content.replace(store_init, store_init + "\n" + sync_effect)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)

print("done")
