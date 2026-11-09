import type { Content, ContentKind } from '../schemas/admin'
import { NewsEditor } from './news-editor/NewsEditor'
import { EventEditor } from './event-editor/EventEditor'
import { RateEditor } from './rate-editor/RateEditor'

type Props = { kind: ContentKind; row: Content | null; onClose: () => void }

export function ContentEditor(props: Props) {
  if (props.kind === 'news')
    return (
      <NewsEditor
        row={props.row && 'excerpt' in props.row ? props.row : null}
        onClose={props.onClose}
      />
    )
  if (props.kind === 'events')
    return (
      <EventEditor
        row={props.row && 'starts_at' in props.row ? props.row : null}
        onClose={props.onClose}
      />
    )
  return (
    <RateEditor
      row={props.row && 'season' in props.row ? props.row : null}
      onClose={props.onClose}
    />
  )
}
