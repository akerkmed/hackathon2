import { describe, expect, it } from "vitest";
import { daysUntil, formatMoney, formatRelativeDays } from "@/lib/format";
import { DEMO_NOW } from "@/lib/domain/seed";

describe("money formatting", () => {
  it("formats Moroccan dirhams in every language", () => {
    expect(formatMoney(19_600, "fr")).toBe("19 600 DH");
    expect(formatMoney(19_600, "darija")).toBe("19 600 DH");
    expect(formatMoney(19_600, "ar")).toBe("19\u00A0600 درهم");
    expect(formatMoney(19_600, "en")).toBe("MAD 19,600");
  });

  it("rounds and keeps negative values explicit", () => {
    expect(formatMoney(300.4, "fr")).toBe("300 DH");
    expect(formatMoney(-50, "en")).toBe("MAD −50");
  });
});

describe("date helpers", () => {
  it("counts the 30-day birth declaration window from the demo date", () => {
    expect(daysUntil("2026-12-07", DEMO_NOW)).toBe(27);
    expect(formatRelativeDays("2026-12-07", DEMO_NOW, "fr")).toBe("dans 27 jours");
    expect(formatRelativeDays("2026-12-07", DEMO_NOW, "en")).toBe("in 27 days");
    expect(formatRelativeDays("2026-12-07", DEMO_NOW, "darija")).toBe("f 27 youm");
  });

  it("handles today, tomorrow and overdue deadlines", () => {
    expect(formatRelativeDays("2026-11-10", DEMO_NOW, "fr")).toBe("aujourd'hui");
    expect(formatRelativeDays("2026-11-11", DEMO_NOW, "en")).toBe("tomorrow");
    expect(formatRelativeDays("2026-11-01", DEMO_NOW, "fr")).toBe("en retard de 9 j");
  });
});
