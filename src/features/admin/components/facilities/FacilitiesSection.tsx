import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import { useAdminFacilities } from '../../hooks/useFacilitiesEditor'
import { useClubMediaCleanup } from '../../hooks/usePier'
import { CatalogListSkeleton } from '../CatalogListSkeleton'
import { Feedback, SectionHeading, secondaryClass } from '../ui'
import { FacilitiesEditor } from './FacilitiesEditor'

export function FacilitiesSection({ userId }: { userId: string }) {
  useClubMediaCleanup()
  const query = useAdminFacilities(userId)
  const editable = useAccess().can('instalaciones.editar')
  const [saved, setSaved] = useState(false)
  return (
    <>
      <SectionHeading
        title="Instalaciones"
        description="Fotos, títulos y descripciones de la sección «Instalaciones» del inicio. Los cambios se publican al guardar."
      />
      {saved && (
        <div className="mb-5">
          <Feedback success="Listo: la sección ya se actualizó en el sitio." />
        </div>
      )}
      {!editable && query.data && (
        <p className="mb-5 rounded-xl border border-navy-900/10 bg-white p-4 text-sm text-ink-600">
          Tu rol permite ver esta sección pero no modificarla.
        </p>
      )}
      {query.isPending ? (
        <CatalogListSkeleton label="Cargando instalaciones" />
      ) : query.isError || !query.data ? (
        <div className="grid min-h-72 justify-items-center gap-4 rounded-2xl border border-navy-900/10 bg-white px-6 py-10 text-center">
          <AlertCircle size={32} aria-hidden="true" className="text-ink-600" />
          <h2 className="text-lg font-extrabold">
            No pudimos cargar las instalaciones
          </h2>
          <Feedback error={query.error} />
          <button
            type="button"
            className={secondaryClass}
            onClick={() => {
              void query.refetch()
            }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        // A new version (after saving) restarts the editor from the published data.
        <FacilitiesEditor
          key={query.data.updated_at}
          data={query.data}
          userId={userId}
          editable={editable}
          onSaved={() => setSaved(true)}
        />
      )}
    </>
  )
}
