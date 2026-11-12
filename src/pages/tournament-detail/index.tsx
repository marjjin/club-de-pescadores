import { useParams } from 'react-router'
import { TournamentDetail } from '@/features/tournaments'

export default function TournamentDetailPage() {
  const { id } = useParams()
  return <TournamentDetail key={id} id={id ?? ''} />
}
