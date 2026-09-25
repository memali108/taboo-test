/**
 * Runtime feature flags. Plain variables, not `NEXT_PUBLIC_*`, so they can be flipped on
 * the Railway service without a rebuild.
 */

/**
 * Adds a required data-processing consent line to /send (SPEC §12).
 *
 * Off by default. Answers about someone's sex life are special-category data under the
 * GDPR, and whether an explicit consent line is needed is a question for whoever advises
 * on the privacy policy — not a judgement to make on their behalf. The checkbox is built
 * so it can be switched on without a rebuild when that answer comes back.
 */
export const requiresDataConsent = () => process.env.REQUIRE_DATA_CONSENT === "true";
