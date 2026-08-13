import { Input, type InputProps } from './Input'

export type SearchInputProps = Omit<InputProps, 'keyboardType'>

/** Named for its role so screens do not re-describe "the search box" each time. */
export function SearchInput({ placeholder = 'Search', ...rest }: SearchInputProps) {
  return <Input {...rest} placeholder={placeholder} />
}
