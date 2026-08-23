with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content = f.read()

content = content.replace('Code } from "lucide-react";', 'Terminal } from "lucide-react";')
content = content.replace('{ id: "install", title: "Install", subtitle: "Step 5", icon: Code }', '{ id: "install", title: "Install", subtitle: "Step 5", icon: Terminal }')

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content)
print("done code icon")
