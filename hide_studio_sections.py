import re

with open('fortend/src/components/studio/Studio.tsx', 'r') as f:
    content = f.read()

# Hide masthead conditionally
old_masthead = """      {/* Masthead */}
      <header className="flex items-center gap-[13px] mb-[22px] sm:mb-[26px]">
        <div className="w-[42px] h-[42px] rounded-[13px] grid place-items-center text-white shadow-panel bg-gradient-to-br from-accent to-accent-strong shrink-0">
          <ShieldCheckIcon className="w-[22px] h-[22px]" />
        </div>
        <div>
          <p className="text-[11.5px] tracking-[.16em] uppercase text-muted font-[700] m-0 mb-0.5">
            ochreshift Studio
          </p>
          <h1 className="text-[clamp(20px,3vw,28px)] tracking-[-.02em] m-0 font-[750]">
            Make it yours
          </h1>
        </div>
      </header>"""

new_masthead = """      {/* Masthead */}
      {!hideBanner && (
        <header className="flex items-center gap-[13px] mb-[22px] sm:mb-[26px]">
          <div className="w-[42px] h-[42px] rounded-[13px] grid place-items-center text-white shadow-panel bg-gradient-to-br from-accent to-accent-strong shrink-0">
            <ShieldCheckIcon className="w-[22px] h-[22px]" />
          </div>
          <div>
            <p className="text-[11.5px] tracking-[.16em] uppercase text-muted font-[700] m-0 mb-0.5">
              ochreshift Studio
            </p>
            <h1 className="text-[clamp(20px,3vw,28px)] tracking-[-.02em] m-0 font-[750]">
              Make it yours
            </h1>
          </div>
        </header>
      )}"""

content = content.replace(old_masthead, new_masthead)

# Hide "Your website" section conditionally
old_website = """            {/* Website URL group */}
            <ControlGroup title="Your website">
              <div>
                <FieldLabel label="Website URL" />
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                    placeholder="https://example.com"
                    value={store.websiteUrl}
                    onChange={(e) => store.setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleIngestUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleIngestUrl()}
                    disabled={ingesting || !store.websiteUrl.trim()}
                    className="shrink-0 inline-flex items-center gap-1 rounded-[9px] bg-accent px-3 py-[9px] text-[12.5px] font-[650] text-white hover:bg-accent-strong disabled:opacity-50 cursor-pointer"
                  >
                    {ingesting ? "Scraping..." : (<><Zap className="h-3.5 w-3.5" /> Connect</>)}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-faint">Paste your URL and click <b className="inline-flex items-center gap-0.5 align-middle"><Zap className="h-3 w-3" /> Connect</b> to scrape your site &amp; connect your agent&apos;s knowledge.</p>
              </div>
            </ControlGroup>"""

new_website = """            {/* Website URL group */}
            {!hideBanner && (
              <ControlGroup title="Your website">
                <div>
                  <FieldLabel label="Website URL" />
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                      placeholder="https://example.com"
                      value={store.websiteUrl}
                      onChange={(e) => store.setWebsiteUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleIngestUrl();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleIngestUrl()}
                      disabled={ingesting || !store.websiteUrl.trim()}
                      className="shrink-0 inline-flex items-center gap-1 rounded-[9px] bg-accent px-3 py-[9px] text-[12.5px] font-[650] text-white hover:bg-accent-strong disabled:opacity-50 cursor-pointer"
                    >
                      {ingesting ? "Scraping..." : (<><Zap className="h-3.5 w-3.5" /> Connect</>)}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-faint">Paste your URL and click <b className="inline-flex items-center gap-0.5 align-middle"><Zap className="h-3 w-3" /> Connect</b> to scrape your site &amp; connect your agent&apos;s knowledge.</p>
                </div>
              </ControlGroup>
            )}"""

content = content.replace(old_website, new_website)

# Make "Brand" defaultOpen conditionally (if hideBanner is true)
old_brand = """            {/* Brand group */}
            <ControlGroup title="Brand">"""
new_brand = """            {/* Brand group */}
            <ControlGroup title="Brand" defaultOpen={hideBanner}>"""
content = content.replace(old_brand, new_brand)


with open('fortend/src/components/studio/Studio.tsx', 'w') as f:
    f.write(content)
print("done")
