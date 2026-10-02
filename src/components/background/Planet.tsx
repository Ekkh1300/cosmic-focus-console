import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'

import { useReducedMotion } from '../../hooks/useAppearance'
import { getPointer, subscribePointer } from '../../hooks/usePointer'
import { useSelector } from '../../store/appStore'
import { webglAvailable, likelyLowPower } from '../../utils/webgl'

/* -------------------------------------------------------------------------
   Procedural planet shader — no textures to download, everything is GPU-side.
   ------------------------------------------------------------------------- */

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec3  uLight;
  uniform vec3  uAccentA;
  uniform vec3  uAccentB;
  uniform vec3  uAccentC;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), f.x),
          mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x),
          mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vPosition);

    // terrain: continents + ridges, drifting extremely slowly
    vec3 sp = vPosition * 1.6;
    float terrain = fbm(sp + vec3(uTime * 0.012, 0.0, uTime * 0.008));
    float ridges  = fbm(sp * 2.4 + 11.0);
    float height  = smoothstep(0.34, 0.74, terrain);

    // base surface
    vec3 deep  = uAccentA;
    vec3 mid   = mix(uAccentA, uAccentB, height);
    vec3 crest = mix(mid, uAccentC, smoothstep(0.55, 0.86, ridges));
    vec3 albedo = mix(deep * 0.55, crest, 0.92);

    // faint orbital grid, denser toward the equator
    float lon = fract(vUv.x * 44.0);
    float lat = fract(vUv.y * 22.0);
    float grid = max(
      1.0 - smoothstep(0.0, 0.035, abs(lon - 0.5)),
      1.0 - smoothstep(0.0, 0.05, abs(lat - 0.5))
    );
    grid *= 0.16 * (1.0 - height * 0.35);
    albedo += uAccentC * grid;

    // day / night with a soft terminator
    float ndl = dot(n, normalize(uLight));
    float day = smoothstep(-0.22, 0.55, ndl);
    float light = 0.14 + day * 0.96;

    // fresnel rim = atmospheric scattering
    float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 2.6);
    vec3 rim = mix(uAccentB, uAccentC, 0.55) * fres * 1.35;

    // night-side city-light speckle, extremely subtle
    float night = 1.0 - day;
    float spark = pow(noise(sp * 14.0), 9.0) * night * 0.6;

    vec3 color = albedo * light + rim + uAccentC * spark;
    color = mix(color, color * vec3(0.82, 0.88, 1.12), fres * 0.5);

    // gentle vignette toward the limb so the sphere reads as volume
    float limb = pow(clamp(dot(n, viewDir), 0.0, 1.0), 0.35);
    color *= mix(0.72, 1.0, limb);

    gl_FragColor = vec4(color * uIntensity, 1.0);
  }
`

const ATMOS_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ATMOS_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uPower;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), uPower);
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`

interface PlanetProps {
  /** Slightly faster rotation while a session is running. */
  running: boolean
  accentHex: string
}

/** The signature ambient object: a slowly turning world behind the console. */
export function Planet({ running, accentHex }: PlanetProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()
  const bg = useSelector((s) => s.settings.background)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    if (!webglAvailable()) {
      setFailed(true)
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setFailed(true)
      return
    }

    const low = likelyLowPower()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1 : 1.6))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.18, 6.2)

    const accent = new THREE.Color(accentHex)
    const accentA = new THREE.Color('#070d2c')
    const accentB = new THREE.Color(accentHex)
    const accentC = new THREE.Color('#5ec8ef')

    const uniforms = {
      uTime: { value: 0 },
      uLight: { value: new THREE.Vector3(1.0, 0.55, 0.85) },
      uAccentA: { value: accentA },
      uAccentB: { value: accentB },
      uAccentC: { value: accentC },
      uIntensity: { value: 0.66 },
    }

    const planetGeo = new THREE.SphereGeometry(1.85, low ? 48 : 96, low ? 32 : 64)
    const planetMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    })
    const planet = new THREE.Mesh(planetGeo, planetMat)
    planet.rotation.z = THREE.MathUtils.degToRad(-16)

    // atmospheric rim — drawn back-facing and additively blended
    const atmosGeo = new THREE.SphereGeometry(2.02, 64, 48)
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: ATMOS_VERT,
      fragmentShader: ATMOS_FRAG,
      uniforms: {
        uColor: { value: accent.clone().lerp(new THREE.Color('#7de8ff'), 0.4) },
        uPower: { value: 3.4 },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)

    // thin orbital ring
    const ringGeo = new THREE.TorusGeometry(2.72, 0.012, 8, 220)
    const ringMat = new THREE.MeshBasicMaterial({
      color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.25),
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.08
    ring.rotation.y = 0.22

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.006, 6, 200),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#7de8ff'),
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    ring2.rotation.x = Math.PI / 1.94
    ring2.rotation.z = 0.3

    // drifting orbital dust
    const dustCount = low ? 90 : 220
    const positions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 2.5 + Math.random() * 1.5
      const y = (Math.random() - 0.5) * 1.1
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(a) * r
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: accentC,
        size: 0.035,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    )

    const group = new THREE.Group()
    group.add(planet, atmosphere, ring, ring2, dust)
    group.position.set(0.15, -0.2, 0)
    scene.add(group)

    /* ---- layout ---- */
    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    /* ---- pointer-driven light (very subtle parallax) ---- */
    let targetX = 0
    let targetY = 0
    const unsubPointer = subscribePointer(() => {
      const p = getPointer()
      targetX = (p.x - 0.5) * 0.6
      targetY = (0.5 - p.y) * 0.4
    })

    /* ---- animation ---- */
    let raf = 0
    let visible = !document.hidden
    let rotY = 0
    let last = performance.now()
    let elapsed = 0
    // one full turn every ~70s idle, ~50s while focusing
    const baseSpeed = (Math.PI * 2) / 70

    const render = () => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      elapsed += dt
      const speed = running ? baseSpeed * 1.45 : baseSpeed
      rotY += reduced ? 0 : speed * dt
      planet.rotation.y = rotY
      dust.rotation.y = rotY * 0.35
      ring.rotation.z += reduced ? 0 : dt * 0.02

      uniforms.uTime.value = elapsed

      const light = uniforms.uLight.value
      light.x += (1.0 + targetX - light.x) * 0.04
      light.y += (0.55 + targetY - light.y) * 0.04
      light.normalize()

      group.position.x += (targetX * 0.12 + 0.15 - group.position.x) * 0.03
      group.position.y += (-targetY * 0.1 - 0.2 - group.position.y) * 0.03

      renderer.render(scene, camera)
      if (visible) raf = requestAnimationFrame(render)
    }

    const start = () => {
      if (!raf && visible) {
        last = performance.now()
        raf = requestAnimationFrame(render)
      }
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const onVisibility = () => {
      visible = !document.hidden
      if (visible) start()
      else stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    /* ---- teardown ---- */
    return () => {
      stop()
      ro.disconnect()
      unsubPointer()
      document.removeEventListener('visibilitychange', onVisibility)
      planetGeo.dispose()
      planetMat.dispose()
      atmosGeo.dispose()
      atmosMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      ring2.geometry.dispose()
      ;(ring2.material as THREE.Material).dispose()
      dustGeo.dispose()
      ;(dust.material as THREE.Material).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [running, accentHex, reduced, bg])

  if (failed) return <CssOrb accent={accentHex} running={running} />

  return (
    <div className="planet-wrap" aria-hidden="true">
      <div ref={mountRef} className="planet-canvas" />
    </div>
  )
}

/** Graceful stand-in when WebGL is missing or the context is lost. */
function CssOrb({ accent, running }: { accent: string; running: boolean }) {
  return (
    <div className="planet-wrap" aria-hidden="true">
      <div
        className={`planet-fallback ${running ? 'is-fast' : ''}`}
        style={
          {
            '--orb-a': accent,
            '--orb-b': '#1e3a8a',
          } as CSSProperties
        }
      />
    </div>
  )
}
