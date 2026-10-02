import { Suspense, lazy } from 'react'

import { useSelector } from '../../store/appStore'
import { Starfield } from './Starfield'

// three.js is heavy — only pull it in when the planet background is selected
const Planet = lazy(() => import('./Planet').then((m) => ({ default: m.Planet })))

const ACCENT_HEX: Record<string, string> = {
  purple: '#a78bfa',
  blue: '#7aa2ff',
  cyan: '#67e8f9',
  pink: '#f472b6',
}

/**
 * The ambient environment: deep space gradient, optional nebula, starfield and
 * the rotating planet. Everything here is aria-hidden — it is pure atmosphere.
 */
export function CosmicBackground() {
  const background = useSelector((s) => s.settings.background)
  const accent = useSelector((s) => s.settings.accent)
  const running = useSelector((s) => s.timer.running)
  const theme = useSelector((s) => s.settings.theme)

  return (
    <div className="cosmos" aria-hidden="true" data-bg={background} data-theme={theme}>
      <div className="cosmos__base" />
      {background === 'nebula' ? (
        <>
          <div className="nebula nebula--a" />
          <div className="nebula nebula--b" />
          <div className="nebula nebula--c" />
        </>
      ) : null}
      {background === 'planet' || background === 'nebula' ? (
        <Suspense fallback={null}>
          <Planet running={running} accentHex={ACCENT_HEX[accent] ?? ACCENT_HEX.purple} />
        </Suspense>
      ) : null}
      <Starfield />
      <div className="cosmos__vignette" />
      <div className="cosmos__grain" />
    </div>
  )
}
