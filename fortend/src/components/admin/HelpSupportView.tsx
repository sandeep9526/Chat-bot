import { SectionHeader } from "@/components/panel/AppShell";
import { cn } from "@/lib/cn";
import Link from "next/link";

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 22a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 0 0 7h5z" />
      <path d="M9.5 2a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0-7h-5z" />
      <path d="M22 14.5a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 7 0v-5z" />
      <path d="M2 9.5a3.5 3.5 0 0 0 7 0v-5a3.5 3.5 0 0 0-7 0v5z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}

function ResourceCard({
  icon: Icon,
  title,
  description,
  buttonText,
  href,
  isExternal = false,
  statusDot = false,
  disabled = false,
}: {
  icon: any;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  isExternal?: boolean;
  statusDot?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <>
      {statusDot && !disabled && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-good"></span>
        </span>
      )}
      {disabled ? "Coming Soon" : buttonText}
      {isExternal && !disabled && <ExternalLinkIcon className="h-3 w-3 opacity-60" />}
    </>
  );

  return (
    <div className={cn(
      "group relative flex flex-col items-start gap-4 rounded-2xl border border-border bg-panel p-6 transition-all",
      disabled ? "opacity-60 grayscale-[50%]" : "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.1)]"
    )}>
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-surface text-fg shadow-sm transition-colors",
        !disabled && "group-hover:border-border-strong"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-[14px] font-[650] text-fg">{title}</h4>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>
      </div>
      <div className="mt-auto pt-2">
        {disabled ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-4 py-2 text-[12.5px] font-[650] text-muted cursor-not-allowed">
            {content}
          </span>
        ) : href.startsWith("/") ? (
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-[12.5px] font-[650] text-fg transition-colors hover:border-accent hover:text-accent"
          >
            {content}
          </Link>
        ) : (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-[12.5px] font-[650] text-fg transition-colors hover:border-accent hover:text-accent"
          >
            {content}
          </a>
        )}
      </div>
    </div>
  );
}

export function HelpSupportView() {
  return (
    <>
      <SectionHeader
        title="Help & Support"
        description="Resources and channels to get the most out of Ochreshift."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-4xl">
        <ResourceCard
          icon={BookIcon}
          title="Documentation"
          description="Read our comprehensive guides, API references, and tutorials to master agent creation."
          buttonText="Read the Docs"
          href="/docs"
        />
        <ResourceCard
          icon={MailIcon}
          title="Email Support"
          description="Encountered an issue or have a billing question? Our team is here to help you directly."
          buttonText="support@ochreshift.com"
          href="mailto:support@ochreshift.com"
        />
        <ResourceCard
          icon={SlackIcon}
          title="Community"
          description="Join other builders in our Slack community. Share tips, ask questions, and showcase your agents."
          buttonText="Join Slack"
          href="#"
          isExternal
          disabled
        />
        <ResourceCard
          icon={ServerIcon}
          title="System Status"
          description="Check the real-time operational status of the Ochreshift platform and API endpoints."
          buttonText="All systems operational"
          href="#"
          statusDot
          disabled
        />
      </div>
    </>
  );
}
