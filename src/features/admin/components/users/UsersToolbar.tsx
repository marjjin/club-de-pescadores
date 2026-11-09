import { CatalogToolbar } from '../CatalogToolbar'
import type { CatalogToolbarProps } from '../CatalogToolbar'

export function UsersToolbar(props: Omit<CatalogToolbarProps, 'kind'>) {
  return <CatalogToolbar kind="users" {...props} />
}
