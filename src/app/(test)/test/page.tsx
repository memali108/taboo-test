import { TestPreview } from "@/components/test/TestPreview";

export const metadata = { title: "The Taboo Test", robots: { index: false } };

/**
 * Phase 1: a walkable preview of the section title card and the statement
 * screens. Nothing is saved — see TestPreview. Phase 2 wires this to the
 * Attempt model, /api/answer, resume and the real progress rules (SPEC §15).
 */
export default function TestPage() {
  return <TestPreview />;
}
