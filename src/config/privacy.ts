/**
 * The privacy policy, verbatim from `docs/privacy-policy.md`.
 *
 * Held as data rather than JSX text so the wording stays exactly as written — no entity
 * escaping, no stray whitespace from formatting — and so every occurrence of the contact
 * address can be turned into a `mailto:` link automatically.
 *
 * `tests/privacy.test.ts` reconstructs the full text from this structure and compares it
 * to the markdown file, so the page and the document cannot drift apart. Edit the
 * markdown and mirror it here; never one without the other.
 *
 * This lives beside `copy.ts` rather than inside it because it is a standalone legal
 * document with a source of truth outside the app, not part of the test's own copy.
 */

export const PRIVACY_TITLE = "Privacy Policy";
export const PRIVACY_LAST_UPDATED = "Last updated: September 26, 2026";
export const PRIVACY_EMAIL = "hello@marieelizabethmali.com";

/** A bullet, optionally opening with a bolded lead. */
export type Item = string | { lead: string; text: string };
export type Block = { p: string; lead?: string } | { ul: Item[] };
export type Section = { heading?: string; blocks: Block[] };

export const PRIVACY_SECTIONS: Section[] = [
  {
    blocks: [
      {
        p: "This policy explains what happens to your information when you take The Taboo Test at tabootest.marieelizabethmali.com.",
      },
      {
        lead: "The short version:",
        p: " The Taboo Test asks personal questions about sex, death and money, so I want to be plain about where your answers go. I store them so I can show you your results, email you your next steps, and send you the test again next quarter with your previous scores for comparison. Your answers are stored on my database host, and your scores go to my email platform so it can send your results. Nobody else gets them. I don't sell your information, I don't share it with advertisers, and you can ask me to delete everything at any time.",
      },
    ],
  },
  {
    heading: "Who I am",
    blocks: [
      { p: "This site is run by Marie-Elizabeth Mali at Relationship Alchemy LLC." },
      { p: "Postal address: 9942 Culver Blvd Unit 1408, Culver City, CA 90232" },
      { p: `Email: ${PRIVACY_EMAIL}` },
    ],
  },
  {
    heading: "What I collect",
    blocks: [
      {
        lead: "When you take the test.",
        p: " Your answers to the fifteen statements, and the scores and levels they produce for Sex, Death and Cash. I also collect some basic technical information: the type of device you're using, roughly where you're visiting from (country level), which site referred you, and the date and time.",
      },
      {
        lead: "When you ask for your results.",
        p: " Your first name and email address. Your answers and results are then linked to that email address.",
      },
      {
        lead: "When you take the test again.",
        p: " Each new set of answers and results is kept alongside your earlier ones, so your next email can show how your scores have moved.",
      },
      { lead: "If you open my emails.", p: " Whether you opened them and which links you clicked." },
      {
        lead: "Whether you're a Substack subscriber.",
        p: " Once a month I note in my email platform which people are subscribers or paid subscribers to The Taboo Trilogy on Substack, using Substack's subscriber export. This makes sure the quarterly retake only goes to current subscribers.",
      },
    ],
  },
  {
    heading: "Please know what your answers are",
    blocks: [
      {
        p: "Your answers are about your sex life, your feelings about death, and your relationship with money. Some privacy laws treat information about someone's sex life as especially sensitive. I treat all of your answers that way: they're stored only where this policy says, used only for the purposes below, and never shared for anyone else's use.",
      },
    ],
  },
  {
    heading: "Why I collect it",
    blocks: [
      {
        ul: [
          "To show you your results.",
          "To email you your next step for each section.",
          "To send you the test again next quarter, with your previous results for comparison.",
          "To understand how the test performs in aggregate: how many people finish it, how scores are distributed, and which statements people find hardest.",
        ],
      },
      {
        p: "The test is a self-reflection tool. Your results are not a diagnosis or an assessment, and they are not medical, psychological, financial or legal advice. I don't use your answers or results to target offers or advertising, and I don't use your information to make automated decisions about you beyond scoring the test itself.",
      },
    ],
  },
  {
    heading: "The legal basis",
    blocks: [
      {
        p: "I use your first name, email address, answers and results to show and email you your results, your next steps and your quarterly retake. That's the service you asked for when you entered your email. You can unsubscribe from any of my emails at any time.",
      },
    ],
  },
  {
    heading: "Your private results link",
    blocks: [
      {
        p: "Your results page has its own private web address. It isn't listed anywhere and can't be guessed, but anyone you share the link with can see your scores. It doesn't show your name or email address.",
      },
    ],
  },
  {
    heading: "Who I share it with",
    blocks: [
      { p: "I use these services to run the test and my emails. Each of them processes your information on my behalf:" },
      {
        ul: [
          { lead: "Railway:", text: " hosting, and the database where your answers and results are stored." },
          {
            lead: "GoHighLevel:",
            text: " my email and contact platform. Your name, email address, scores, levels and next steps are stored there, and my emails are sent from it.",
          },
        ],
      },
      { p: "I do not sell your personal information, and I do not share it with third parties for their own marketing." },
    ],
  },
  {
    heading: "How long I keep it",
    blocks: [
      {
        p: "I keep your contact details, answers and results until you ask me to delete them. That includes earlier results, which I keep so your retake emails can show how you've changed. If you unsubscribe, I keep a minimal record of your email address so I don't accidentally email you again. Anonymous statistics (scores with no contact details attached) may be kept indefinitely.",
      },
    ],
  },
  {
    heading: "Your choices",
    blocks: [
      {
        ul: [
          "Unsubscribe using the link at the bottom of any email. It works immediately.",
          `See what I hold about you, correct it, or ask me to delete it (including all your answers and past results) by emailing ${PRIVACY_EMAIL}. I'll respond within 30 days.`,
        ],
      },
      {
        p: "If you're in the UK or EU, you also have the right to object to processing, to restrict it, to receive your data in a portable format, and to complain to your data protection authority. If you're in California, you have the right to know what's collected, to request deletion, and not to be discriminated against for exercising those rights.",
      },
    ],
  },
  {
    heading: "Cookies and similar technologies",
    blocks: [
      {
        p: "The test uses one cookie to remember your progress, so a refresh or a break doesn't lose your answers. It's necessary for the test to work. There are no advertising or third-party tracking cookies.",
      },
    ],
  },
  {
    heading: "Children",
    blocks: [
      {
        p: "This test isn't intended for anyone under 18, and I don't knowingly collect information from children. The test deals with adult themes.",
      },
    ],
  },
  {
    heading: "Security",
    blocks: [
      {
        p: "Information is stored on encrypted, access-controlled services. No system is perfectly secure, but I take reasonable steps to protect what you've given me.",
      },
    ],
  },
  {
    heading: "Changes",
    blocks: [
      {
        p: "If I change this policy in a way that matters, I'll update the date at the top and, for significant changes, say so by email.",
      },
    ],
  },
  {
    heading: "Contact",
    blocks: [{ p: `For questions about any of this, email ${PRIVACY_EMAIL}.` }],
  },
];
