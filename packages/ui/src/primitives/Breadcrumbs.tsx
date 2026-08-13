import { Fragment } from 'react'
import { Pressable } from 'react-native'
import { Inline } from './Inline'
import { Text } from './Text'

export type Crumb = { label: string; href?: string }

export type BreadcrumbsProps = { items: Crumb[]; onNavigate?: (href: string) => void }

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <Inline gap="xs">
      {items.map((crumb, index) => {
        const isLast = index === items.length - 1

        return (
          <Fragment key={crumb.label}>
            {crumb.href && !isLast ? (
              <Pressable focusable onPress={() => onNavigate?.(crumb.href!)}>
                <Text variant="caption" color="muted">
                  {crumb.label}
                </Text>
              </Pressable>
            ) : (
              <Text variant="caption" color={isLast ? 'secondary' : 'muted'}>
                {crumb.label}
              </Text>
            )}
            {isLast ? null : (
              <Text variant="caption" color="muted" style={{ opacity: 0.6 }}>
                /
              </Text>
            )}
          </Fragment>
        )
      })}
    </Inline>
  )
}
