import { addDoc, collection } from "firebase/firestore/lite";
import { db } from "../firebase";

interface Pick2TelemetryPayload {
  itemId?: string;
  presetLabel?: string;
  countSelected: number;
  page: string;
  ts?: number;
}

let telemetryEnabled = false;
let telemetrySampleRate = 1;

export const setPick2TelemetryConfig = (config?: {
  telemetryEnabled?: boolean;
  telemetrySampleRate?: number;
}) => {
  telemetryEnabled = Boolean(config?.telemetryEnabled);
  const nextRate = typeof config?.telemetrySampleRate === "number" ? config.telemetrySampleRate : 1;
  telemetrySampleRate = Math.min(1, Math.max(0, nextRate));
};

const shouldSample = () => Math.random() <= telemetrySampleRate;

export const logPick2Event = async (eventName: string, payload: Pick2TelemetryPayload) => {
  if (!db || !telemetryEnabled || !shouldSample()) {
    return;
  }

  try {
    await addDoc(collection(db, "pick2_events"), {
      eventName,
      ...payload,
      ts: payload.ts ?? Date.now(),
    });
  } catch (error) {
    console.warn("Pick2 telemetry write failed", error);
  }
};
