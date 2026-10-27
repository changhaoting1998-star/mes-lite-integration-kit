export function normalizeErpOrder(payload) {
  for (const field of ["externalOrderId", "productRef", "quantity", "dueAt"]) {
    if (!payload[field]) throw new Error(`Missing ERP order field: ${field}`);
  }
  return {
    externalId: String(payload.externalOrderId),
    productExternalId: String(payload.productRef),
    plannedQuantity: Number(payload.quantity),
    dueAt: new Date(payload.dueAt).toISOString(),
  };
}

export function normalizeWarehouseIssue(payload) {
  if (!payload?.externalEventId || !Array.isArray(payload.lines)) {
    throw new Error("Invalid warehouse issue event");
  }
  return {
    externalEventId: String(payload.externalEventId),
    orderExternalId: String(payload.orderExternalId),
    lines: payload.lines.map((line) => ({
      materialExternalId: String(line.materialRef),
      quantity: Number(line.quantity),
      unit: String(line.unit),
    })),
  };
}

export function buildFeishuProductionNotice({ orderId, status, dueAt, actionUrl }) {
  return {
    msg_type: "interactive",
    card: {
      header: { template: status === "PAUSED" ? "orange" : "blue", title: { tag: "plain_text", content: "生产工单状态更新" } },
      elements: [
        { tag: "markdown", content: `工单：${orderId}\n状态：${status}\n计划完成：${dueAt}` },
        ...(actionUrl ? [{ tag: "action", actions: [{ tag: "button", type: "primary", text: { tag: "plain_text", content: "查看工单" }, url: actionUrl }] }] : []),
      ],
    },
  };
}
