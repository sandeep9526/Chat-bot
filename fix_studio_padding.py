import re

with open('fortend/src/components/studio/Studio.tsx', 'r') as f:
    content = f.read()

# Replace padding in Studio wrapper
old_wrapper = """  return (
    <div className="w-full max-w-[1240px] mx-auto py-6 px-4 sm:px-6 lg:py-8 lg:px-8 pb-20">"""
new_wrapper = """  return (
    <div className={`w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 ${hideBanner ? "pt-2 lg:pt-4" : "py-6 lg:py-8"}`}>"""

content = content.replace(old_wrapper, new_wrapper)

with open('fortend/src/components/studio/Studio.tsx', 'w') as f:
    f.write(content)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'r') as f:
    content_wiz = f.read()

old_wiz_wrapper = """        <div className="flex-1 flex flex-col bg-bg overflow-hidden relative">
          <div className="flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto pt-6 px-6">"""
new_wiz_wrapper = """        <div className="flex-1 flex flex-col bg-bg overflow-hidden relative">
          <div className="flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto pt-0 px-6">"""

content_wiz = content_wiz.replace(old_wiz_wrapper, new_wiz_wrapper)

with open('fortend/src/components/onboarding/OnboardingWizard.tsx', 'w') as f:
    f.write(content_wiz)

print("done")
