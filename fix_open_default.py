import re

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

old_effect = """  useEffect(() => {
    if (step === "appearance" && isLoaded) {
      store.setBotId(botId || "");"""

new_effect = """  useEffect(() => {
    if (step === "appearance" && isLoaded) {
      store.setOpen(true);
      store.setBotId(botId || "");"""

content = content.replace(old_effect, new_effect)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)

print("done")
