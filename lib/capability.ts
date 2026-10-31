/**
 * Deferred: WebGPU / device-memory checks for on-device Gemma.
 * Cloud path is the MVP default until this is wired.
 */
export type DeviceCapability = {
  webgpu: boolean;
  enoughMemory: boolean;
  recommendedPath: "on-device" | "cloud";
  reason: string;
};

export async function checkDeviceCapability(): Promise<DeviceCapability> {
  return {
    webgpu: false,
    enoughMemory: false,
    recommendedPath: "cloud",
    reason: "On-device path deferred; using cloud Gemma 4 via Gemini API.",
  };
}
