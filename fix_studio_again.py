import re

with open('fortend/src/components/studio/Studio.tsx', 'r') as f:
    content = f.read()

# 1. Update padding
old_wrapper = """  return (
    <div className="w-full max-w-[1240px] mx-auto py-6 px-4 sm:px-6 lg:py-8 lg:px-8 pb-20">"""
new_wrapper = """  return (
    <div className={`w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 ${hideBanner ? "pt-2 pb-10 lg:pt-4" : "py-6 lg:py-8 pb-20"}`}>"""
content = content.replace(old_wrapper, new_wrapper)

# 2. Hide Top Banner
old_banner = """      {botId && <StudioBotBanner botId={botId} />}"""
new_banner = """      {!hideBanner && botId && <StudioBotBanner botId={botId} />}"""
content = content.replace(old_banner, new_banner)

# 3. Hide Masthead
old_masthead = """      {/* Masthead */}
      <header className="flex items-center gap-[13px] mb-[22px] sm:mb-[26px]">"""
new_masthead = """      {/* Masthead */}
      {!hideBanner && (
        <header className="flex items-center gap-[13px] mb-[22px] sm:mb-[26px]">"""
content = content.replace(old_masthead, new_masthead)

old_masthead_close = """          </div>
        </header>"""
new_masthead_close = """          </div>
        </header>
      )}"""
content = content.replace(old_masthead_close, new_masthead_close)

# 4. Hide Industry Templates (Wait, user didn't ask to hide it, but it was there in git? Actually it is in git, I didn't hide it before.)
# Wait, user said "Make it yours section, Your website section also hide from step 4".
# Wait, did "Make it yours" refer to Industry Templates? No, Masthead has "Make it yours".
# I will hide "Industry Templates" if hideBanner is true just in case, because in Step 4 we don't want templates.
old_templates = """            {/* Industry Templates group */}
            <ControlGroup title="Industry Templates" defaultOpen>"""
new_templates = """            {/* Industry Templates group */}
            {!hideBanner && (
              <ControlGroup title="Industry Templates" defaultOpen>"""
content = content.replace(old_templates, new_templates)

old_templates_close = """                <p className="mt-2 text-[11px] text-faint leading-relaxed">
                  Selecting a template auto-configures logo, website URL, brand color, greeting, sample questions AND indexes full knowledge base into AI memory!
                </p>
              </div>
            </ControlGroup>"""
new_templates_close = """                <p className="mt-2 text-[11px] text-faint leading-relaxed">
                  Selecting a template auto-configures logo, website URL, brand color, greeting, sample questions AND indexes full knowledge base into AI memory!
                </p>
              </div>
            </ControlGroup>
            )}"""
content = content.replace(old_templates_close, new_templates_close)

# 5. Hide EmbedCode
old_embed = """          {/* Signed-in editing a real bot → show the embed snippet. Public
              visitor → the "Make it yours" funnel instead (an embed snippet is
              useless with no account/bot yet). */}
          {botId ? <EmbedCode config={cfg} /> : <MakeItYoursCard />}"""
new_embed = """          {/* Signed-in editing a real bot → show the embed snippet. Public
              visitor → the "Make it yours" funnel instead (an embed snippet is
              useless with no account/bot yet). */}
          {!hideBanner && (botId ? <EmbedCode config={cfg} /> : <MakeItYoursCard />)}"""
content = content.replace(old_embed, new_embed)

# 6. Default open Brand when in wizard
old_brand = """            {/* Brand group */}
            <ControlGroup title="Brand">"""
new_brand = """            {/* Brand group */}
            <ControlGroup title="Brand" defaultOpen={hideBanner}>"""
content = content.replace(old_brand, new_brand)

# 7. Add hideBanner prop to Studio
old_studio_decl = """export function Studio({ botId = "" }: { botId?: string }) {"""
new_studio_decl = """export function Studio({ botId = "", hideBanner = false }: { botId?: string, hideBanner?: boolean }) {"""
content = content.replace(old_studio_decl, new_studio_decl)

# 8. Add sticky adjust for wizard
old_sidebar = """        <aside className="w-full bg-surface border border-border rounded-[20px] shadow-panel overflow-hidden lg:sticky lg:top-[74px] lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">"""
new_sidebar = """        <aside className={`w-full bg-surface border border-border rounded-[20px] shadow-panel overflow-hidden lg:sticky ${hideBanner ? "lg:top-0 lg:max-h-screen" : "lg:top-[74px] lg:max-h-[calc(100vh-96px)]"} lg:overflow-y-auto`}>"""
content = content.replace(old_sidebar, new_sidebar)

with open('fortend/src/components/studio/Studio.tsx', 'w') as f:
    f.write(content)

print("done")
