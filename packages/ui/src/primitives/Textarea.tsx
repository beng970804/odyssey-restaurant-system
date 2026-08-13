import { Input, type InputProps } from './Input'

export type TextareaProps = Omit<InputProps, 'multiline'>

export function Textarea(props: TextareaProps) {
  return <Input {...props} multiline numberOfLines={4} />
}
