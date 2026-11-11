import { useClubMediaCleanup } from '../../hooks/usePier'
import { SectionHeading } from '../ui'
import { PierHistory } from './PierHistory'
import { PierReportForm } from './PierReportForm'

export function PierSection({ userId }: { userId: string }) {
  useClubMediaCleanup()
  return (
    <>
      <SectionHeading
        title="Parte del muelle"
        description="Cargá la altura del río, contá cómo está el muelle y sumá fotos o videos. Se publica en el inicio del sitio."
      />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <PierReportForm userId={userId} />
        <PierHistory userId={userId} />
      </div>
    </>
  )
}
