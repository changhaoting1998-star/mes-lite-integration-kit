import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrder,
  reportOperation,
  transitionOrder,
} from "../src/index.js";

function demoOrder() {
  return createOrder({
    id: "demo_order_test",
    productId: "demo_product_test",
    plannedQuantity: 10,
    dueAt: "2099-12-31T00:00:00.000Z",
  }, { at: "2099-01-01T00:00:00.000Z" });
}

test("public demo orders require synthetic identifiers", () => {
  assert.throws(() => createOrder({ id: "order_1", productId: "p", plannedQuantity: 1, dueAt: "2099-01-01" }), /demo_/);
});

test("order cannot skip directly from planned to production", () => {
  assert.throws(() => transitionOrder(demoOrder(), "IN_PROGRESS"), /Unsupported/);
});

test("reported quantity cannot exceed plan", () => {
  let order = transitionOrder(demoOrder(), "RELEASED", { actorId: "demo_planner" });
  order = transitionOrder(order, "IN_PROGRESS", { actorId: "demo_operator" });
  assert.throws(() => reportOperation(order, { stepId: "demo_step", goodQuantity: 11 }), /exceeds/);
});

test("completed order requires full quantity coverage", () => {
  let order = transitionOrder(demoOrder(), "RELEASED");
  order = transitionOrder(order, "IN_PROGRESS");
  order = reportOperation(order, { id: "demo_op_1", stepId: "demo_step", goodQuantity: 9, scrapQuantity: 1 });
  order = transitionOrder(order, "COMPLETED");
  assert.equal(order.status, "COMPLETED");
  assert.equal(order.completedQuantity, 9);
  assert.equal(order.scrappedQuantity, 1);
});
