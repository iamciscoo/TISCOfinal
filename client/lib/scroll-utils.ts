export type ScrollBehaviorMode = 'auto' | 'smooth'

function getAppScrollContainer(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  return document.querySelector('[data-app-scroll-container="true"]') as HTMLElement | null
}

export function getScrollTarget(): Window | HTMLElement {
  if (typeof window === 'undefined') {
    throw new Error('Scroll target is only available in the browser')
  }

  if (window.matchMedia('(max-width: 767px)').matches) {
    return getAppScrollContainer() || window
  }

  return window
}

export function scrollToTop(behavior: ScrollBehaviorMode = 'smooth') {
  const target = getScrollTarget()

  if (target instanceof Window) {
    target.scrollTo({ top: 0, behavior })
    return
  }

  target.scrollTo({ top: 0, behavior })
}

export function scrollElementIntoViewWithOffset(
  element: HTMLElement | null,
  offset: number,
  behavior: ScrollBehaviorMode = 'smooth'
) {
  const target = getScrollTarget()

  if (target instanceof Window) {
    const top = element ? (element.getBoundingClientRect().top + window.scrollY - offset) : 180
    target.scrollTo({ top: Math.max(0, top), behavior })
    return
  }

  const containerRect = target.getBoundingClientRect()
  const top = element
    ? (element.getBoundingClientRect().top - containerRect.top + target.scrollTop - offset)
    : 180

  target.scrollTo({ top: Math.max(0, top), behavior })
}
