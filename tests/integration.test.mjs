import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFeishuProductionNotice,
  canReleaseOperation,
  createIdempotencyStore,
  evaluateCheckpoint,
  normalizeErpOrder,
  normalizeWarehouseIssue,
} from "../src/index.js";

test("quality checkpoint blocks out-of-range values", () => {
  const checkpoint = { id: "demo_cp", type: "RANGE", minimum: 9.5, maximum: 10.5 };
  const result = evaluateCheckpoint(checkpoint, { value: 11 });
  assert.equal(result.passed, false);
  assert.equal(canReleaseOperation([result]), false);
});

test("idempotency store returns the first result", () => {
  const store = createIdempotencyStore();
  assert.equal(store.record("demo_event_1", { ok: true }).duplicate, false);
  const duplicate = store.record("demo_event_1", { ok: false });
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.result, { ok: true });
});

test("normalizes generic ERP and warehouse messages", () => {
  const order = normalizeErpOrder({ externalOrderId: "demo_ext_order", productRef: "demo_product", quantity: 3, dueAt: "2099-01-01" });
  const issue = normalizeWarehouseIssue({ externalEventId: "demo_event", orderExternalId: "demo_ext_order", lines: [{ materialRef: "demo_material", quantity: 3, unit: "demo_unit" }] });
  assert.equal(order.plannedQuantity, 3);
  assert.equal(issue.lines[0].quantity, 3);
});

test("Feishu notice excludes sensitive production fields", () => {
  const notice = buildFeishuProductionNotice({ orderId: "demo_order_1", status: "PAUSED", dueAt: "2099-01-01" });
  const text = JSON.stringify(notice);
  assert.match(text, /demo_order_1/);
  assert.doesNotMatch(text, /recipe|customer|app_secret|access_token/i);
});
