import { CodeXml } from "lucide-react";
import { Reveal } from "./Reveal";
import {
  WordPressIcon,
  ShopifyIcon,
  WixIcon,
  WebflowIcon,
  SquarespaceIcon,
} from "./platform-icons";

export const WORKS_WITH = [
  "WordPress",
  "Shopify",
  "Wix",
  "Webflow",
  "Squarespace",
  "Custom HTML",
] as const;

interface Platform {
  name: string;
  brandLight: string;
  brandDark: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const PLATFORMS: Platform[] = [
  { name: "WordPress", brandLight: "#21759B", brandDark: "#4FA3C7", Icon: WordPressIcon },
  { name: "Shopify", brandLight: "#7AB55C", brandDark: "#8CC96E", Icon: ShopifyIcon },
  { name: "Wix", brandLight: "#0C6EFC", brandDark: "#5C9BFF", Icon: WixIcon },
  { name: "Webflow", brandLight: "#146EF5", brandDark: "#5C9BFF", Icon: WebflowIcon },
  { name: "Squarespace", brandLight: "#1A1A1A", brandDark: "#F5F5F5", Icon: SquarespaceIcon },
];

export function ProofBar() {
  return (
    <section aria-label="Platform compatibility" className="border-b border-border bg-bg-2">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-9 py-9 flex flex-col lg:flex-row items-center justify-center gap-x-12 gap-y-6 font-sans">
        <Reveal>
          <span className="text-[12px] font-[700] uppercase tracking-widest text-faint whitespace-nowrap">
            Works with
          </span>
        </Reveal>

        <Reveal delay={80}>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:gap-x-10">
            {PLATFORMS.map(({ name, brandLight, brandDark, Icon }) => (
              <li
                key={name}
                title={`Works with ${name}`}
                className="group flex items-center gap-2.5 cursor-default"
                style={{
                  ["--brand" as string]: brandLight,
                  ["--brand-dark" as string]: brandDark,
                }}
              >
                <Icon
                  size={24}
                  className="text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-(--brand) dark:group-hover:text-(--brand-dark)"
                />
                <span className="text-[15px] font-[600] text-muted transition-colors duration-200 group-hover:text-fg">
                  {name}
                </span>
              </li>
            ))}
            <li title="Works with custom HTML sites" className="group flex items-center gap-2.5 cursor-default">
              <CodeXml
                size={23}
                className="text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-accent"
              />
              <span className="text-[15px] font-[600] text-muted transition-colors duration-200 group-hover:text-fg">
                Custom HTML
              </span>
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
