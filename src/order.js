export const ORDER_STATUS = Object.freeze({
  PLANNED: "PLANNED",
  RELEASED: "RELEASED",
  IN_PROGRESS: "IN_PROGRESS",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
});

const TRANSITIONS = {
  PLANNED: new Set(["RELEASED", "CANCELLED"]),
  RELEASED: new Set(["IN_PROGRESS", "CANCELLED"]),
  IN_PROGRESS: new Set(["PAUSED", "COMPLETED"]),
  PAUSED: new Set(["IN_PROGRESS", "CANCELLED"]),
  COMPLETED: new Set(["CLOSED"]),
  CLOSED: new Set(),
  CANCELLED: new Set(),
};

export function createOrder(input, options = {}) {
  for (const field of ["id", "productId", "plannedQuantity", "dueAt"]) {
    if (input[field] === undefined || input[field] === null || input[field] === "") {
      throw new Error(`Missing order field: ${field}`);
    }
  }
  if (!String(input.id).startsWith("demo_") && options.mode !== "production") {
    throw new Error("Public demo orders must use demo_ identifiers");
  }
  if (!Number.isFinite(input.plannedQuantity) || input.plannedQuantity <= 0) {
    throw new Error("Planned quantity must be positive");
  }
  const now = options.at || new Date().toISOString();
  return {
    id: input.id,
    productId: input.productId,
    plannedQuantity: input.plannedQuantity,
    completedQuantity: 0,
    scrappedQuantity: 0,
    status: ORDER_STATUS.PLANNED,
    dueAt: input.dueAt,
    createdAt: now,
    updatedAt: now,
    operations: [],
    history: [],
  };
}

export function transitionOrder(order, to, metadata = {}) {
  if (!TRANSITIONS[order.status]?.has(to)) {
    throw new Error(`Unsupported order transition: ${order.status} -> ${to}`);
  }
  if (to === ORDER_STATUS.COMPLETED && order.completedQuantity + order.scrappedQuantity < order.plannedQuantity) {
    throw new Error("Reported quantity does not cover the planned quantity");
  }
  const now = metadata.at || new Date().toISOString();
  return {
    ...order,
    status: to,
    updatedAt: now,
    history: [...order.history, { from: order.status, to, actorId: metadata.actorId || "demo_system", at: now, note: metadata.note || "" }],
  };
}

export function reportOperation(order, input, options = {}) {
  if (order.status !== ORDER_STATUS.IN_PROGRESS) throw new Error("Order must be in progress");
  const good = Number(input.goodQuantity || 0);
  const scrap = Number(input.scrapQuantity || 0);
  if (!Number.isFinite(good) || !Number.isFinite(scrap) || good < 0 || scrap < 0 || good + scrap <= 0) {
    throw new Error("Reported quantities must be non-negative and non-zero in total");
  }
  if (order.completedQuantity + order.scrappedQuantity + good + scrap > order.plannedQuantity) {
    throw new Error("Reported quantity exceeds the planned quantity");
  }
  const now = options.at || new Date().toISOString();
  return {
    ...order,
    completedQuantity: order.completedQuantity + good,
    scrappedQuantity: order.scrappedQuantity + scrap,
    updatedAt: now,
    operations: [...order.operations, {
      id: input.id || `demo_operation_${Date.now()}`,
      stepId: input.stepId,
      operatorId: input.operatorId || "demo_operator",
      goodQuantity: good,
      scrapQuantity: scrap,
      occurredAt: now,
    }],
  };
}
