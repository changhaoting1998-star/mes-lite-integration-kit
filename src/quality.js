export function evaluateCheckpoint(checkpoint, measurement) {
  if (!checkpoint?.id || !checkpoint?.type) throw new Error("Invalid quality checkpoint");
  if (checkpoint.type === "RANGE") {
    const value = Number(measurement.value);
    if (!Number.isFinite(value)) throw new Error("A numeric measurement is required");
    const passed = value >= checkpoint.minimum && value <= checkpoint.maximum;
    return { checkpointId: checkpoint.id, passed, value, reason: passed ? null : "OUT_OF_RANGE" };
  }
  if (checkpoint.type === "BOOLEAN") {
    const passed = measurement.value === checkpoint.expected;
    return { checkpointId: checkpoint.id, passed, value: measurement.value, reason: passed ? null : "UNEXPECTED_VALUE" };
  }
  throw new Error("Unsupported checkpoint type");
}

export function canReleaseOperation(results) {
  return results.length > 0 && results.every((result) => result.passed);
}
