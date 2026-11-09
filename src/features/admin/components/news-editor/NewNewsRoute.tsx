import { useNavigate } from 'react-router'
import { NewsEditor } from './NewsEditor'

export function NewNewsRoute() {
  const navigate = useNavigate()
  return (
    <NewsEditor
      row={null}
      onClose={() => {
        void navigate('/admin/noticias')
      }}
    />
  )
}
