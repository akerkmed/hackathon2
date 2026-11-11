import { describe, expect, it } from "vitest";
import { BENEFITS, LIFE_EVENTS, SERVICES, serviceById, servicesForEvent } from "@/lib/domain/catalog";
import { SOURCES, sourceById } from "@/lib/domain/sources";

describe("service catalog integrity", () => {
  it("has the six hero services for a new baby", () => {
    expect(servicesForEvent("new_baby")).toHaveLength(6);
  });

  it("gives every service a source, at least one rule and a consent scope", () => {
    for (const service of SERVICES) {
      expect(service.sourceIds.length, service.id).toBeGreaterThan(0);
      expect(service.ruleIds.length, service.id).toBeGreaterThan(0);
      expect(service.scope.length, service.id).toBeGreaterThan(0);
      for (const sourceId of service.sourceIds) {
        expect(sourceById(sourceId), `${service.id} → ${sourceId}`).toBeDefined();
      }
    }
  });

  it("has unique service and benefit ids", () => {
    expect(new Set(SERVICES.map((service) => service.id)).size).toBe(SERVICES.length);
    expect(new Set(BENEFITS.map((benefit) => benefit.id)).size).toBe(BENEFITS.length);
  });

  it("keeps dependency references resolvable inside the same life event", () => {
    for (const service of SERVICES) {
      for (const dependency of service.dependsOn) {
        const parent = serviceById(dependency);
        expect(parent, `${service.id} depends on ${dependency}`).toBeDefined();
        expect(parent?.lifeEventId).toBe(service.lifeEventId);
      }
    }
  });

  it("excludes the non-stackable ASD grant from the new-baby plan", () => {
    const asd = BENEFITS.find((benefit) => benefit.id === "asd_birth_grant");
    expect(asd?.status).toBe("NOT_ELIGIBLE");
    expect(servicesForEvent("new_baby").some((service) => service.benefitOneOff === 2_000)).toBe(false);
  });
});

describe("public source registry", () => {
  it("has unique ids and valid https URLs", () => {
    expect(new Set(SOURCES.map((source) => source.id)).size).toBe(SOURCES.length);
    for (const source of SOURCES) {
      expect(source.url.startsWith("https://"), source.id).toBe(true);
      expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("covers every life event exposed by the product", () => {
    const eventIds = new Set(LIFE_EVENTS.map((event) => event.id));
    expect(eventIds.size).toBe(6);
    for (const event of LIFE_EVENTS) {
      expect(servicesForEvent(event.id).length, event.id).toBeGreaterThan(0);
    }
  });
});
