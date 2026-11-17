import { useParams } from 'react-router'
import { AnnualTableDetail } from '@/features/tournaments'

export default function AnnualTablePage() {
  const { id } = useParams()
  return <AnnualTableDetail key={id} id={id ?? ''} />
}
