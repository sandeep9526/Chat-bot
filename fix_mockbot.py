with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

old_bot = """  const mockBot: AdminBot = {
    bot_id: botId || "",
    name: name,
    accent: accent,
    welcome: welcome,
    suggestions: suggestions,
  };"""

new_bot = """  const mockBot = {
    bot_id: botId || "",
    name: name,
    accent: accent,
    welcome: welcome,
    suggestions: suggestions,
  } as AdminBot;"""

content = content.replace(old_bot, new_bot)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)
print("done")
