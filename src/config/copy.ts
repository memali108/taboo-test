/**
 * Every word a respondent reads. Verbatim from SPEC.md Appendix A.
 *
 * INVARIANT (SPEC §0.4): copy lives here and nowhere else, and is never written,
 * rewritten or "improved" by anyone but Marie-Elizabeth. Anything still marked
 * `[COPY TBD: ...]` renders as-is, brackets included, so it is visible in review.
 *
 * Statement wording is locked per TEST_VERSION alongside its order and reversal
 * flags — see src/config/test.ts and CLAUDE.md. Changing a word means a new
 * version, never an edit in place.
 */

export const TBD = (note: string) => `[COPY TBD: ${note}]`;

/** Rendered as-is wherever copy is still to be written. */
export const COPY_TBD = "[COPY TBD]";

// ─── Landing (/) ────────────────────────────────────────────────────────────

export const LANDING = {
  title: "The Taboo Test: How Uptight Are You About Sex, Death & Cash?",
  intro:
    "Read each statement and rate how true it is for you, right now — not who you want to be, not who you used to be. Be honest.",
  introTbd: TBD('replacement for "Nobody sees this but you."'),
  expectationTbd: TBD(
    'decide whether to keep "Most people score lower than they expect in at least one section. The lowest score is where you could stand to loosen up."',
  ),
  meta: "15 statements · about 3 minutes",
  button: "Begin",
} as const;

// ─── The scale, shown on every statement card (SPEC §5.1) ───────────────────

export const SCALE = [
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Always" },
] as const;

// ─── Statements, locked content for TEST_VERSION v1 (SPEC §5.2) ─────────────

export const STATEMENT_TEXT_V1 = [
  // SEX
  "I feel sexy AF.",
  "I have regrets about my sexual history.",
  "I'm fully comfortable expressing my sexual desires.",
  "I completely embrace how my body is changing with age.",
  TBD(
    'replacement for "I\'m able to freely live my life even with the awfulness of sexual assault culture all over the news."',
  ),
  // DEATH
  "I could die today and feel complete.",
  "Knowing I will die one day inspires me to live full-out in each moment.",
  "I allow myself to fully grieve.",
  "I'm terrified of feeling pain, getting sick, and dying in agony.",
  "I have my affairs in order, so my loved ones know where to find what they need if I suddenly die.",
  // CASH
  "I am fully confident I have everything I need.",
  "I'm up at night worrying about money.",
  "I'm secretly jealous of folks who have more money than I do.",
  "I'm totally on top of my finances, accounting, and even taxes.",
  "I feel guilty and unworthy when I indulge myself.",
] as const;

// ─── Section title cards (SPEC §5.3) ────────────────────────────────────────

/**
 * The title card's button. A separate entry from LANDING.button even though both read
 * "Begin" today: they are two different buttons, and one should be able to change
 * without silently dragging the other.
 */
export const SECTION_TITLE = {
  button: "Begin",
} as const;

export const SECTION_COPY = {
  sex: {
    name: "Sex",
    subtitle: "Your relationship with desire.",
    description:
      "Your sex score reflects how at home you feel in your desires. Not only what happens in bed, but how freely you inhabit your body, your history, and your wants. It's one of the most loaded categories because so much conspires to make us feel wrong about it.",
    levels: {
      low: {
        page: [
          "Something's contracted here, and you probably already know it. Maybe it's your history, your body image, something picked up from culture or family, a relationship, and most likely some combination. The research on this is consistent: shame and silence don't protect us; they only keep us stuck.",
          "Desire that has nowhere to go doesn't disappear; it goes underground and shows up sideways. For example, in manipulating to get what you want instead of being direct, flirting in an awkward (or creepy) way, or pushing away what would make you happy.",
          "The good news: awareness is the first step. Get curious instead of critical. Ask yourself what it would mean to feel sexy AF. What's actually in the way?",
        ],
        startHere:
          "Write down the three words you most wish someone would use to describe you sexually. Example: Hot, luscious, creative. Don't edit. Notice what comes up for you when you read them over and decide on the first step you could take to embody the first word. Then take that step.",
      },
      medium: {
        page: [
          "You've done some good work. There are places where you feel at home in your skin and others where you're not quite there yet. This is actually a rich zone, because you know enough to know what's unhealed. The question isn't what's wrong with you; it's what you're still protecting yourself from liberating.",
        ],
        startHere:
          "Identify the one statement in this section you rated lowest. Journal on what informed your answer and what a high score might look like for you in that area. For example, feeling comfortable enough to be loud in bed, or asking for a vulnerable desire, or finally feeling zero shame about the fumbling around you did in your teens.",
      },
      high: {
        page: [
          "You're living in your body and owning your desire without much apology. That's rarer than it should be. Whatever got you here — therapy, a mentor, experience, sheer tenacity — it's working. This isn't a place to coast, though. The question worth sitting with: how openly do you talk about this with the people closest to you? Freedom that stays private has a ceiling.",
        ],
        startHere:
          "Journal about a desire you'd normally keep to yourself. Notice what happens in your body as you write about it. Plan to have a conversation about it with someone this month.",
      },
    },
  },
  death: {
    name: "Death",
    subtitle: "Your relationship with impermanence.",
    description:
      "Your death score measures how much you've made peace with the fact that this all ends. Not in a morbid way, but in the way that changes how you spend your downtime, what you tolerate, and what you stop tolerating. Most people score lower here than they expect, because we live in a culture that treats death as a failure rather than a fact.",
    levels: {
      low: {
        page: [
          "You're not alone. Most people haven't looked at death directly. But avoidance has a cost, and it usually shows up as low-grade anxiety that seems unrelated to mortality. Terror management theory, one of the more robust frameworks in psychology, suggests that much of what drives human behavior — the status-seeking, the busyness, the unexamined relationships — is death anxiety in a suit.",
          "One concrete place to start: get your affairs in order. Will, healthcare proxy, end-of-life wishes, basically the folder your people would need if you died tomorrow. It won't dissolve the existential dread, but it removes one layer of it and signals to your nervous system that you're willing to look.",
        ],
        startHere:
          "Set a timer for 10 minutes and write the answer to these questions: If I knew I had one year left, what would I stop doing? What would I start doing? If it's not coming easily, try writing your answer with your non-dominant hand (it works to access a different part of your brain).",
      },
      medium: {
        page: [
          "You've thought about death more than most. You can talk about it, maybe even joke about it. But there's still some uptightness around pain, incompleteness, legacy, and the people you'd leave behind. Your work here isn't intellectual; you've clearly done that part. It's about letting the reality of death land in your body, not just your head, and letting that change something about how you're actually living now.",
        ],
        startHere:
          "Pick one thing you've been putting off that you'd regret leaving undone if you were to unexpectedly die, choose a date to do it, and do it on that date.",
      },
      high: {
        page: [
          "You've sat with mortality, and it hasn't broken you; it's sharpened you. There's a specific freedom that comes from that, and it shows in how people like you make decisions, end things, and begin things. The question worth asking now: Are you living accordingly?",
        ],
        startHere:
          "Journal about where you could bring your life into greater alignment with how you define a well-lived and well-rounded life. For example, who you want to spend time with, what you spend your money on, how much you allow yourself to rest, how much time you spend outdoors, and how much you create.",
      },
    },
  },
  cash: {
    name: "Cash",
    subtitle: "Your relationship with enough.",
    description:
      "Your cash score isn't about how much money you have. It's about your relationship to it: the anxiety, the resentment, the avoidance, the indulgence, the desire. Money is one of the last real taboos, and most of us carry more charge around it than we realize, regardless of what our account balance says.",
    levels: {
      low: {
        page: [
          "There's real distress here, whether it's practical, psychological, or both. The resentment and the 3:00 am worry are signals worth taking seriously, not as moral failures, but as information. Research on financial anxiety consistently shows that the emotional weight of money stress is usually only loosely tied to your actual finances. The money story you're running is probably inherited and outdated.",
        ],
        startHere:
          "Write down the first money memory you have. How old were you? What's the feeling in it? Who and where did it come from? What else does it bring up for you? You're probably still living out some version of that story.",
      },
      medium: {
        page: [
          "You're functional but not free. The basics are mostly handled, which is saying a lot, but something still nags. Maybe it's the indulgence question; maybe it's the resentment and jealousy you don't fully admit to; maybe it's that the taxes are filed, but you feel behind in ways that are harder to name. Pick the one question in this section that stung the most. That's the thread to follow.",
        ],
        startHere:
          "Write about the last 3 purchases you made. What motivated you? How do you feel about them in your head and your body? The answer might be something like, Tylenol, pickles, and a thrifted top, and even so, there's good information there for you to unpack.",
      },
      high: {
        page: [
          "You've built a genuinely healthy relationship with money. You're confident, clear, and not losing sleep over it. That's hard to hold and worth acknowledging. The flex here isn't your account balance; it's the absence of the mental noise around money most people carry.",
          "The question for you now is how to use this freedom well. Money ease, like physical health, is most interesting when it becomes a foundation for something greater rather than an end in itself.",
        ],
        startHere:
          "Pick someone in your life who could benefit from your confident relationship with money. This is not about giving advice; it's about modeling presence and ease around money conversations. Here's a great way to kick-start a money conversation: Ask them: If you never needed to earn another dime and had more money than you could ever spend, what would you do differently with your life?",
      },
    },
  },
} as const;

// ─── Email step (/send) — SPEC §7.4 ─────────────────────────────────────────

export const SEND = {
  heading: "Where should I send your results?",
  body: TBD("one-line body for the email step"),
  button: TBD("button label for the email step"),
  consentLabel: TBD("mailing-list checkbox label"),
  finePrint: TBD("fine print under the email step button"),
  /** Only rendered when REQUIRE_DATA_CONSENT is on. See SPEC §12. */
  dataConsentLabel: TBD("required data-processing consent line (SPEC §12)"),
} as const;

// ─── Results page (/r/[id]) — SPEC §7.5 ─────────────────────────────────────

export const RESULTS = {
  heading: "HERE ARE YOUR TABOO TEST RESULTS",
  intro:
    "You just did something courageous and honest. You took The Taboo Test. Take a breath and notice what you're feeling in your body: tension, relief, resistance, surprise, or something you might not have a name for yet.",
  terrainLabel: "Your most interesting terrain",
  levelLabels: { low: "Low", medium: "Medium", high: "High" },
  zoneLabels: { low: "Low", medium: "Medium", high: "High" },
  /** The page's call to action: it points at the email, which carries the practices. */
  loopLine: "Check your inbox. I've sent you one thing to do for each section.",
  deliverabilityNote: "If it lands in Promotions or Spam, make sure to drag it to your Inbox.",
  // There is no "Take it again" link: retakes come from the quarterly email (SPEC §4.5).
} as const;

/**
 * Terrain lines — SPEC §6 and §8.1. One sentence covering every tie case, so the
 * GoHighLevel template needs no logic of its own.
 *
 * `{Section}` is filled with the section name by `terrainLine()` in src/lib/terrain.ts,
 * in Sex → Death → Cash order. They are kept here as plain strings rather than template
 * functions so `tests/copy.test.ts` can still check them against SPEC.md word for word.
 */
export const TERRAIN_LINE = {
  one: "Your lowest score is in {Section}. That's your most interesting terrain right now, and where a real shift is possible.",
  two: "{Section} and {Section} tied for your lowest score. Both are interesting terrain right now. Start with the one you'd rather avoid.",
  all: "All three sections scored the same. Your terrain is whichever one you'd most like to skip. Start there.",
} as const;

/** SPEC §8.1 `taboo_change_line` — empty on a first attempt. */
export const CHANGE_LINE_TBD = TBD(
  'change line for retakes, e.g. "Since your last test on June 3: Sex 12 → 17, Death 15 → 15, Cash 9 → 13."',
);
