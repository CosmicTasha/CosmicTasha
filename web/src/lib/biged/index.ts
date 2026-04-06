import { BigEdClient } from './client';

export { BigEdClient, BigEdConnectionError, BigEdError } from './client';
export { BigEdEventSource } from './events';
export { useBigEdInference, useBigEdStatus } from './hooks';
export type {
  Agent,
  FleetEvent,
  FleetStatus,
  HwState,
  InferenceRequest,
  InferenceResponse,
  SkillRequest,
  Task,
} from './types';

let singleton: BigEdClient | null = null;

/**
 * Returns a shared BigEdClient instance.
 * Reads BIGED_URL from the environment on first call.
 */
export function getBigEdClient(): BigEdClient {
  if (!singleton) {
    singleton = new BigEdClient();
  }
  return singleton;
}
