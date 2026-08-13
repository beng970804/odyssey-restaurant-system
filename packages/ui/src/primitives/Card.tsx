import type { SurfaceProps } from './Surface'
import { Surface } from './Surface'

export type CardProps = Omit<SurfaceProps, 'background'>

/** A Surface with the house defaults: bordered, raised, comfortably padded. */
export function Card({
  elevation = 'raised',
  padding = 'lg',
  bordered = true,
  ...rest
}: CardProps) {
  return (
    <Surface
      background="surface"
      elevation={elevation}
      padding={padding}
      bordered={bordered}
      {...rest}
    />
  )
}
