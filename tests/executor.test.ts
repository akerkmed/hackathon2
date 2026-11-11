import { describe, expect, it } from "vitest";
import { createSession, findReceipt } from "@/lib/domain/store";
import { buildPlan, requiredScopes } from "@/lib/domain/plans";
import { executePlan } from "@/lib/domain/executor";
import type { ActionEvent } from "@/lib/domain/types";

const session = () => createSession(`exec-${Math.random().toString(36).slice(2)}`);

describe("plan executor", () => {
  it("executes every service, creates a case, documents and a signed receipt", async () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const events: ActionEvent[] = [];

    const result = await executePlan(store, plan.id, requiredScopes(plan), 0, (event) => events.push(event));

    expect(result.plan.status).toBe("COMPLETED");
    expect(result.caseFile.status).toBe("COMPLETED");
    expect(result.caseFile.actions.every((action) => action.status === "DONE")).toBe(true);
    expect(result.caseFile.documentIds.length).toBeGreaterThanOrEqual(3);
    expect(result.receipt.total).toBe(50);
    expect(result.receipt.benefitOneOff).toBe(19_600);
    expect(result.receipt.benefitMonthly).toBe(300);
    expect(result.receipt.hash).toHaveLength(24);
    expect(result.receipt.code).toMatch(/^M3AK-[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(events[0].type).toBe("plan_started");
    expect(events[events.length - 1].type).toBe("plan_completed");
    expect(events.some((event) => event.type === "action_done")).toBe(true);
    expect(store.consents.some((consent) => consent.planId === plan.id && consent.status === "ACTIVE")).toBe(true);
    expect(store.metrics.costPaid).toBe(50);
    expect(store.lifeEvents.find((event) => event.id === "new_baby")?.status).toBe("DONE");
  });

  it("registers the receipt in the public verification registry", async () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const result = await executePlan(store, plan.id, requiredScopes(plan), 0, () => {});
    const found = findReceipt(result.receipt.code);

    expect(found).toBeDefined();
    expect(found?.receipt.id).toBe(result.receipt.id);
    expect(found?.citizenName).toBe("Yasmine Benali");
    expect(findReceipt("M3AK-0000-0000")).toBeUndefined();
  });

  it("refuses execution when consent is missing", async () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    await expect(executePlan(store, plan.id, [], 0, () => {})).rejects.toThrow("CONSENT_REQUIRED");
    expect(store.cases).toHaveLength(0);
    expect(store.receipts).toHaveLength(0);
  });

  it("is idempotent for an already completed plan", async () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const first = await executePlan(store, plan.id, requiredScopes(plan), 0, () => {});
    const second = await executePlan(store, plan.id, requiredScopes(plan), 0, () => {});
    expect(second.receipt.id).toBe(first.receipt.id);
    expect(store.receipts).toHaveLength(1);
    expect(store.cases).toHaveLength(1);
  });

  it("only charges services with a fee and keeps every amount server-side", async () => {
    const store = session();
    const plan = buildPlan(store, "new_baby");
    const result = await executePlan(store, plan.id, requiredScopes(plan), 0, () => {});
    expect(result.receipt.items).toHaveLength(1);
    expect(result.receipt.items[0].amount).toBe(50);
    expect(result.receipt.items.reduce((sum, item) => sum + item.amount, 0)).toBe(result.receipt.total);
  });
});
