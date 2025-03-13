"use client"

import { useEffect, useRef, useState } from "react"

export function useResizeObserver<T extends HTMLElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const resizeObserver = useRef<ResizeObserver | null>(null)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const observeTarget = ref.current
    let rafId: number

    resizeObserver.current = new ResizeObserver((entries) => {
      rafId = requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return

        const entry = entries[0]
        const { width, height } = entry.contentRect
        setSize({ width, height })
      })
    })

    resizeObserver.current.observe(observeTarget)

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect()
      }
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return { ref, ...size }
}

