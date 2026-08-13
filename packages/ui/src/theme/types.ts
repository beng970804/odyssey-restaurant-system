/**
 * The shape comes before the values. `darkTheme` has to satisfy `Theme`, so a
 * token added to light and forgotten in dark is a compile error rather than an
 * invisible label someone finds in a demo.
 */

/** What a surface is *for*, never what colour it happens to be. */
export type ColorTokens = {
  bg: { canvas: string; surface: string; raised: string; overlay: string; inset: string }
  text: { primary: string; secondary: string; muted: string; inverse: string; onBrand: string }
  border: { subtle: string; default: string; strong: string; focus: string }
  brand: { default: string; hover: string; active: string; subtle: string; onBrand: string }
  status: Record<StatusTone, { bg: string; fg: string; border: string }>
}

/**
 * The vocabulary `ORDER_STATUS_TONE` in @repo/types maps onto. A Badge takes a
 * tone; the theme decides what a tone looks like. That is what keeps the
 * primitive free of business knowledge.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type SpaceToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'screen' | 'full'
export type TypographyToken =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'mono'
export type ElevationToken = 'flat' | 'raised' | 'overlay' | 'modal'

/** Size, weight and line height travel together, so text is chosen by role. */
export type TypographyStyle = {
  fontSize: number
  fontWeight: '400' | '500' | '600' | '700'
  lineHeight: number
  letterSpacing?: number
  fontFamily?: string
}

/** Shadow on web and iOS, `elevation` on Android — one token, both platforms. */
export type ElevationStyle = {
  shadowColor: string
  shadowOpacity: number
  shadowRadius: number
  shadowOffset: { width: number; height: number }
  elevation: number
}

export type Theme = {
  mode: 'light' | 'dark'
  color: ColorTokens
  space: Record<SpaceToken, number>
  radius: Record<RadiusToken, number>
  typography: Record<TypographyToken, TypographyStyle>
  elevation: Record<ElevationToken, ElevationStyle>
  borderWidth: Record<'thin' | 'medium' | 'thick', number>
  /**
   * Layout lives in the token file like everything else, so "how wide is the
   * sidebar" has one answer rather than one per screen.
   */
  layout: {
    breakpoints: { sm: number; md: number; lg: number; xl: number }
    sidebarWidth: number
    sidebarCollapsedWidth: number
    contentMaxWidth: number
    gridColumns: number
    gutter: number
  }
}
