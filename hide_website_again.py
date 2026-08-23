import re

with open('fortend/src/components/studio/Studio.tsx', 'r') as f:
    content = f.read()

old_website_group = """            {/* Website URL group */}
            <ControlGroup title="Your website">"""

new_website_group = """            {/* Website URL group */}
            {!hideBanner && (
              <ControlGroup title="Your website">"""

content = content.replace(old_website_group, new_website_group)

old_website_end = """                  <p className="mt-1.5 text-[11px] text-faint">Paste your URL and click <b className="inline-flex items-center gap-0.5 align-middle"><Zap className="h-3 w-3" /> Connect</b> to scrape your site &amp; connect your agent&apos;s knowledge.</p>
                </div>
              </ControlGroup>"""

new_website_end = """                  <p className="mt-1.5 text-[11px] text-faint">Paste your URL and click <b className="inline-flex items-center gap-0.5 align-middle"><Zap className="h-3 w-3" /> Connect</b> to scrape your site &amp; connect your agent&apos;s knowledge.</p>
                </div>
              </ControlGroup>
            )}"""

content = content.replace(old_website_end, new_website_end)

with open('fortend/src/components/studio/Studio.tsx', 'w') as f:
    f.write(content)

print("done")
