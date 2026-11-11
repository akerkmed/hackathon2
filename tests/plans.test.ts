import { describe, expect, it } from "vitest";
import { createSession } from "@/lib/domain/store";
import {
  buildPlan,
  cancelPlan,
  requiredScopes,
  validatePlan,
} from "@/lib/domain/plans";
import { servicesForEvent } from "@/lib/domain/catalog";

const session = () => createSession(`test-${Math.random().toString(36).slice(2)}`);

describe("plan builder", () => {
  it("builds the six-service new-baby plan with deterministic amounts", () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");

    expect(plan.actions).toHaveLength(servicesForEvent("new_baby").length);
    expect(plan.actions).toHaveLength(6);
    expect(plan.totalCost).toBe(50);
    expect(plan.benefitOneOff).toBe(19_600);
    expect(plan.benefitMonthly).toBe(300);
    expect(plan.status).toBe("AWAITING_CONFIRMATION");
    expect(plan.sources.length).toBeGreaterThanOrEqual(3);
    expect(plan.trace.some((step) => step.code === "rules.matched")).toBe(true);
    expect(store.activePlanId).toBe(plan.id);
  });

  it("orders actions by dependency", () => {
    const plan = buildPlan(session(), "new_baby");
    const index = (id: string) => plan.actions.findIndex((action) => action.id === id);
    for (const action of plan.actions) {
      for (const dependency of action.dependsOn) {
        expect(index(dependency)).toBeLessThan(index(action.id));
      }
    }
  });

  it("rejects execution without the required consent scopes", () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const result = validatePlan(store, plan.id, []);
    expect(result).toEqual({ ok: false, error: "CONSENT_REQUIRED" });
  });

  it("accepts a plan when every required scope is granted", () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const result = validatePlan(store, plan.id, requiredScopes(plan));
    expect(result.ok).toBe(true);
  });

  it("blocks client-side amount tampering", () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    plan.totalCost = 1;
    const result = validatePlan(store, plan.id, requiredScopes(plan));
    expect(result).toEqual({ ok: false, error: "AMOUNT_TAMPERING_BLOCKED" });
  });

  it("rejects an unknown plan id", () => {
    expect(validatePlan(session(), "missing", [])).toEqual({ ok: false, error: "PLAN_NOT_FOUND" });
  });

  it("cancels an awaiting plan and clears the active plan", () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const cancelled = cancelPlan(store, plan.id);
    expect(cancelled?.status).toBe("CANCELLED");
    expect(store.activePlanId).toBeUndefined();
    expect(validatePlan(store, plan.id, requiredScopes(plan))).toEqual({
      ok: false,
      error: "PLAN_CANCELLED",
    });
  });

  it("does not cancel an already completed plan", () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    plan.status = "COMPLETED";
    expect(cancelPlan(store, plan.id)).toBeUndefined();
    expect(plan.status).toBe("COMPLETED");
  });
});
