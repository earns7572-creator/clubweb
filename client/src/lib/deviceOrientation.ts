/* Club Craft motion rule: device sensor angles are converted to a screen-compensated quaternion, never used as raw camera angles. */
import * as THREE from "three";

export type OrientationPermission = "granted" | "denied" | "unsupported";

type PermissionCapableOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: (absolute?: boolean) => Promise<"granted" | "denied">;
};

const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const screenQuaternion = new THREE.Quaternion();
const cameraCorrection = new THREE.Quaternion(-Math.sqrt(.5), 0, 0, Math.sqrt(.5));

export async function requestOrientationPermission(): Promise<OrientationPermission> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return "unsupported";
  const Orientation = DeviceOrientationEvent as PermissionCapableOrientation;
  if (typeof Orientation.requestPermission !== "function") return "granted";
  try {
    return (await Orientation.requestPermission(false)) === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

export function getScreenOrientationDegrees() {
  if (typeof window === "undefined") return 0;
  const screenAngle = window.screen?.orientation?.angle;
  if (typeof screenAngle === "number") return screenAngle;
  return typeof window.orientation === "number" ? window.orientation : 0;
}

export function writeDeviceOrientationQuaternion(output: THREE.Quaternion, alphaDegrees: number, betaDegrees: number, gammaDegrees: number, screenDegrees: number) {
  const alpha = THREE.MathUtils.degToRad(alphaDegrees);
  const beta = THREE.MathUtils.degToRad(betaDegrees);
  const gamma = THREE.MathUtils.degToRad(gammaDegrees);
  const screenRadians = THREE.MathUtils.degToRad(screenDegrees);
  euler.set(beta, alpha, -gamma, "YXZ");
  output.setFromEuler(euler).multiply(cameraCorrection);
  screenQuaternion.setFromAxisAngle(zee, -screenRadians);
  return output.multiply(screenQuaternion);
}
