import { useEffect, useRef, useState } from 'react'

interface Props {
  srcDoc: string
  width: number
  height: number
  title: string
}

const CHECKERBOARD = {
  backgroundImage:
    'conic-gradient(#0000001a 25%, transparent 0 50%, #0000001a 0 75%, transparent 0)',
  backgroundSize: '20px 20px',
}

/**
 * Renders the page at its real resolution inside an iframe, then scales it down to fit the
 * available space, so layouts in px behave exactly as on the playout output.
 */
export function PreviewFrame({ srcDoc, width, height, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const scale = box.width && box.height ? Math.min(box.width / width, box.height / height) : 0

  return (
    <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
      <div
        className="relative overflow-hidden ring-1 ring-border"
        style={{ width: width * scale, height: height * scale, ...CHECKERBOARD }}
      >
        <iframe
          title={title}
          srcDoc={srcDoc}
          // No allow-same-origin: layer scripts must not reach the app session.
          sandbox="allow-scripts"
          className="absolute top-0 left-0 border-0 bg-transparent"
          style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        />
      </div>
    </div>
  )
}
