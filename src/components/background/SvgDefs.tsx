/**
 * Shared SVG filter definitions. `liquidWarp` is a real displacement map used
 * for hover distortion on primary controls — applied as a regular CSS filter,
 * which has far broader support than displacing a backdrop.
 */
export function SvgDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter id="liquidWarp" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.02"
            numOctaves={2}
            seed={7}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="14s"
              values="0.012 0.02;0.02 0.014;0.012 0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
