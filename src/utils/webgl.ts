/** Detect WebGL once, with a cached result so we never re-probe per render. */
let cached: boolean | null = null

export function webglAvailable(): boolean {
  if (cached !== null) return cached
  if (typeof document === 'undefined') {
    cached = false
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    cached = Boolean(gl)
    // release the probe context immediately
    const lose = gl?.getExtension('WEBGL_lose_context')
    lose?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

/** Cheap heuristic: drop heavy layers on constrained machines. */
export function likelyLowPower(): boolean {
  if (typeof navigator === 'undefined') return false
  const n = navigator as Navigator & { deviceMemory?: number }
  const cores = navigator.hardwareConcurrency ?? 8
  const mem = n.deviceMemory ?? 8
  return cores <= 4 || mem <= 4
}
