import type { ReactNode } from "react";
import {
  PRIVACY_EMAIL,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  type Item,
} from "@/config/privacy";

export const metadata = { title: PRIVACY_TITLE };

/** Turn every occurrence of the contact address into a mailto link. */
function withEmailLinks(text: string): ReactNode[] {
  return text.split(PRIVACY_EMAIL).flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={`mailto:${PRIVACY_EMAIL}`} className="text-red underline underline-offset-2 hover:text-red-deep">
            {PRIVACY_EMAIL}
          </a>,
          part,
        ],
  );
}

const Lead = ({ children }: { children: string }) => (
  <strong className="font-semibold text-ink">{children}</strong>
);

function Bullet({ item }: { item: Item }) {
  if (typeof item === "string") return <>{withEmailLinks(item)}</>;
  return (
    <>
      <Lead>{item.lead}</Lead>
      {withEmailLinks(item.text)}
    </>
  );
}

/**
 * The policy, rendered from `src/config/privacy.ts`, which mirrors
 * `docs/privacy-policy.md` verbatim. `tests/privacy.test.ts` pins the two together.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 sm:px-8 sm:pb-24">
      <h1 className="font-display mt-8 text-[clamp(2.75rem,9vw,4.5rem)] text-red">{PRIVACY_TITLE}</h1>
      <p className="mt-3 text-sm text-ink">{PRIVACY_LAST_UPDATED}</p>

      {PRIVACY_SECTIONS.map((section, si) => (
        <section key={section.heading ?? si} className={section.heading ? "mt-12" : "mt-8"}>
          {section.heading && <h2 className="font-display text-3xl text-ink sm:text-4xl">{section.heading}</h2>}
          {section.blocks.map((block, bi) =>
            "ul" in block ? (
              <ul key={bi} className="mt-4 flex max-w-prose list-disc flex-col gap-2 pl-5 text-lg leading-relaxed text-ink-2">
                {block.ul.map((item, ii) => (
                  <li key={ii}>
                    <Bullet item={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p key={bi} className="mt-4 max-w-prose text-lg leading-relaxed text-ink-2">
                {block.lead && <Lead>{block.lead}</Lead>}
                {withEmailLinks(block.p)}
              </p>
            ),
          )}
        </section>
      ))}
    </article>
  );
}
