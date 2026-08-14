import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Platform, View, type HostInstance, type ViewStyle } from 'react-native'
import { createPortal } from 'react-dom'
import { useTheme } from '../theme/ThemeProvider'

/** A position react-native-web understands and React Native's style types do not. */
const VIEWPORT_FIXED = 'fixed' as ViewStyle['position']

/** Between the control and the panel it opens. */
const GAP = 6
/** Below this much room underneath the control, the panel opens upwards. */
const MIN_SPACE_BELOW = 220
/** Breathing room between the panel and the edge of the window. */
const VIEWPORT_MARGIN = 12

type Anchor = { top: number; left: number; width: number; height: number }

export type PopoverProps = {
  open: boolean
  onClose: () => void
  /** The control the panel hangs from. Its own press handler owns opening. */
  children: ReactNode
  content: ReactNode
  /** A menu is as wide as its control; a calendar is as wide as it needs to be. */
  matchTriggerWidth?: boolean
  /** Which edge the panel lines up with when it is wider than the control. */
  align?: 'start' | 'end'
  label?: string
}

/**
 * An anchored panel that escapes its layout, mounted on the document body
 * rather than beside the control that opened it.
 *
 * Two bugs are the reason. An absolutely positioned menu is painted inside its
 * parent's stacking context, so the orders filter menu went *behind* the table
 * header below it — a z-index on the menu cannot beat a sibling higher up the
 * tree. And a menu that only closes when you choose something leaves two menus
 * open at once: clicking "channel" while "status" was open stacked them.
 *
 * Mounting on the body fixes the first outright. A document-level pointerdown
 * listener fixes the second, and fixes it *without* a swallowing backdrop:
 * pressing another control closes this panel and still reaches that control, so
 * the second menu opens on the same click that dismissed the first.
 */
export function Popover({
  open,
  onClose,
  children,
  content,
  matchTriggerWidth = false,
  align = 'start',
  label,
}: PopoverProps) {
  const theme = useTheme()
  const triggerRef = useRef<HostInstance | null>(null)
  const contentRef = useRef<HostInstance | null>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [panelWidth, setPanelWidth] = useState(0)

  const measure = useCallback(() => {
    triggerRef.current?.measureInWindow(
      (left: number, top: number, width: number, height: number) =>
        setAnchor({ top, left, width, height }),
    )
  }, [])

  // Measured on open, and again whenever the page moves under it: a panel
  // pinned to the viewport has to be told when its control scrolls away.
  // Web only past the first measure — React Native has a `window` global with
  // no DOM event API on it, and calling addEventListener there was the crash
  // behind every filter press on the phone.
  useEffect(() => {
    if (!open) return
    measure()
    if (Platform.OS !== 'web' || typeof window === 'undefined') return

    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, measure])

  // The panel's own width, which the horizontal clamp needs: a panel anchored
  // to a control near the right edge has to know how wide it is to know how
  // far left to slide. Watched rather than measured once, because a calendar
  // paging between months can change size while open.
  useEffect(() => {
    if (!open) return
    const node = contentRef.current as unknown as HTMLElement | null
    if (!node || typeof node.getBoundingClientRect !== 'function') return

    setPanelWidth(node.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      setPanelWidth(node.getBoundingClientRect().width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    // A host instance is a DOM node under react-native-web, which is the only
    // platform this listener runs on.
    const contains = (ref: HostInstance | null, target: Node) =>
      ref !== null && (ref as unknown as Node).contains(target)

    const onPointerDown = (event: Event) => {
      const target = event.target
      if (!(target instanceof Node)) return
      // The trigger's own press toggles this panel shut; the panel's own rows
      // need to survive long enough to fire. Everything else is "outside".
      if (contains(triggerRef.current, target) || contains(contentRef.current, target)) return
      onClose()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    // Capture, so a panel closes even where something below stops propagation.
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const panel = open ? (
    <View
      ref={contentRef}
      aria-label={label}
      style={[
        placement(anchor, matchTriggerWidth, align, panelWidth),
        {
          borderRadius: theme.radius.md,
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.default,
          backgroundColor: theme.color.bg.overlay,
          paddingVertical: theme.space.xs,
          overflow: 'hidden',
        },
        theme.elevation.overlay,
      ]}
    >
      {content}
    </View>
  ) : null

  return (
    <View ref={triggerRef} style={{ position: 'relative' }}>
      {children}
      {panel !== null && Platform.OS === 'web' && typeof document !== 'undefined'
        ? createPortal(panel, document.body)
        : panel}
    </View>
  )
}

/**
 * Slide a panel left just far enough to stay inside the viewport. Anchored to
 * its control's left edge, a panel wider than the room to its right — the date
 * picker on a phone — ran off the screen, calendar and all. Pure and exported
 * so the arithmetic is testable without a browser to measure in.
 */
export function clampPanelLeft(
  anchorLeft: number,
  panelWidth: number,
  viewportWidth: number,
): number {
  return Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchorLeft, viewportWidth - panelWidth - VIEWPORT_MARGIN),
  )
}

/**
 * Where the panel sits. Before the first measurement — and on native, where
 * there is no portal to escape into — it falls back to hanging off the control
 * in ordinary flow, which is both correct there and invisible here: `open`
 * flips and the measurement lands in the same frame.
 */
function placement(
  anchor: Anchor | null,
  matchTriggerWidth: boolean,
  align: 'start' | 'end',
  panelWidth: number,
): ViewStyle {
  if (anchor === null || Platform.OS !== 'web') {
    return { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: GAP, zIndex: 50 }
  }

  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const below = viewportHeight - (anchor.top + anchor.height)
  // Upwards only when down is genuinely cramped *and* up is roomier — a panel
  // that flips for the sake of eight pixels reads as a glitch.
  const flipUp = below < MIN_SPACE_BELOW && anchor.top > below

  return {
    position: VIEWPORT_FIXED,
    zIndex: 150,
    maxHeight: (flipUp ? anchor.top : below) - GAP - VIEWPORT_MARGIN,
    ...(flipUp
      ? { bottom: viewportHeight - anchor.top + GAP }
      : { top: anchor.top + anchor.height + GAP }),
    // Never wider than the viewport leaves room for, whatever the content asks.
    maxWidth: viewportWidth - VIEWPORT_MARGIN * 2,
    ...(matchTriggerWidth
      ? { left: anchor.left, width: anchor.width }
      : align === 'end'
        ? { right: Math.max(VIEWPORT_MARGIN, viewportWidth - (anchor.left + anchor.width)) }
        : {
            left: clampPanelLeft(anchor.left, panelWidth, viewportWidth),
            minWidth: Math.min(anchor.width, viewportWidth - VIEWPORT_MARGIN * 2),
          }),
  }
}
