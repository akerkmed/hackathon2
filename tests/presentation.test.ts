import { describe, expect, it } from "vitest";
import { PRESENTATION, TOUR_STEPS } from "@/lib/copy/presentation";
import { LANGS } from "@/lib/i18n";

describe("presentation walkthrough", () => {
  it("has unique ids and valid routes", () => {
    expect(new Set(TOUR_STEPS.map((step) => step.id)).size).toBe(TOUR_STEPS.length);
    for (const step of TOUR_STEPS) {
      expect(step.path.startsWith("/"), step.id).toBe(true);
      expect(step.target.startsWith('[data-tour="'), step.id).toBe(true);
      expect(step.duration, step.id).toBeGreaterThan(1_000);
    }
  });

  it("ships every step and control label in all four languages", () => {
    for (const value of Object.values(PRESENTATION)) {
      for (const lang of LANGS) {
        expect(value[lang].trim(), `${value.en} · ${lang}`).not.toHaveLength(0);
      }
    }
    for (const step of TOUR_STEPS) {
      for (const value of [step.chapter, step.title, step.body]) {
        for (const lang of LANGS) {
          expect(value[lang].trim(), `${step.id} · ${lang}`).not.toHaveLength(0);
        }
      }
    }
  });

  it("covers the main product surfaces", () => {
    const paths = new Set(TOUR_STEPS.map((step) => step.path));
    for (const path of ["/", "/space", "/chat", "/benefits", "/documents", "/cases", "/sources", "/verify"]) {
      expect(paths.has(path), path).toBe(true);
    }
  });
});
