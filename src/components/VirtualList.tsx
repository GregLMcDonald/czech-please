import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props<T> {
  items: T[]
  rowHeight: number
  render: (item: T, index: number) => ReactNode
  overscan?: number
  className?: string
}

/**
 * Lightweight fixed-row windowing list — renders only the visible slice so the
 * dictionary stays smooth with hundreds of results. No external dependency.
 */
export default function VirtualList<T>({
  items,
  rowHeight,
  render,
  overscan = 6,
  className,
}: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(600)

  // Track the scroll container's height so the window size adapts to the screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setViewport(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const total = items.length * rowHeight
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = Math.ceil(viewport / rowHeight) + overscan * 2
  const end = Math.min(items.length, start + visibleCount)
  const slice = items.slice(start, end)

  return (
    <div
      ref={ref}
      className={'vlist ' + (className || '')}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: total, position: 'relative' }}>
        <div style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {slice.map((item, i) => (
            <div key={start + i} style={{ height: rowHeight }}>
              {render(item, start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
