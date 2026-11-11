import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import * as auth from '../api/auth'
import * as data from '../api/data'
import * as pier from '../api/pier'
import { AdminPanel } from './AdminPanel'
import { PasswordForm } from './PasswordForm'
import { ContentEditor } from './ContentEditor'
import { UserEditor } from './UserEditor'
import { EmailForm } from './EmailForm'

vi.mock('../api/auth', () => ({
  getAdminSession: vi.fn(),
  subscribeAuth: vi.fn(() => () => {}),
  signIn: vi.fn(),
  signOut: vi.fn(),
  recoverPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateEmail: vi.fn(),
  enrollFactor: vi.fn(),
  verifyFactor: vi.fn(),
}))
vi.mock('../api/data', () => ({
  getDashboard: vi.fn(),
  listAdmin: vi.fn(),
  saveContent: vi.fn(),
  getPermissions: vi.fn(),
  saveRole: vi.fn(),
  deleteRole: vi.fn(),
  inviteUser: vi.fn(),
  saveUser: vi.fn(),
}))
vi.mock('../api/pier', () => ({
  listPierReports: vi.fn(),
  publishPierReport: vi.fn(),
  setPierReportPublished: vi.fn(),
}))
vi.mock('../api/media', () => ({
  pruneClubMedia: vi.fn(() => Promise.resolve()),
  clubMediaUrl: vi.fn(),
  isVideoFile: vi.fn(),
  uploadClubMedia: vi.fn(),
  removeClubMedia: vi.fn(),
  mediaFiles: vi.fn(() => []),
}))
const session = {
  id: '10000000-0000-4000-8000-000000000010',
  email: 'root@example.test',
  active: true,
  general: true,
  pier: true,
  permissions: [] as string[],
  aal2: true,
  factorId: null,
}
function mount(node = <AdminPanel />, path = '/admin') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="admin/*" element={node} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}
beforeEach(() => {
  vi.mocked(pier.listPierReports).mockResolvedValue([])
  vi.mocked(auth.getAdminSession).mockResolvedValue(null)
  vi.mocked(data.getDashboard).mockResolvedValue({
    news: 2,
    events: 1,
    rates: 0,
    drafts: 3,
    users: 1,
  })
})
it('opens the news editor from the dashboard shortcut and returns to the news list', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue(session)
  vi.mocked(data.listAdmin).mockResolvedValue([])
  mount()
  fireEvent.click(
    await screen.findByRole('link', { name: 'Escribir una noticia' }),
  )
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Crear noticia' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('textbox', { name: 'Texto de la noticia' }),
  ).toBeTruthy()
  expect(screen.getByText('Elegir una imagen')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Volver a noticias' }))
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Noticias' }),
  ).toBeTruthy()
  expect(data.saveContent).not.toHaveBeenCalled()
})

it('shows login without fetching administrative content for anonymous visitors', async () => {
  mount()
  expect(
    await screen.findByRole('heading', { name: 'Ingresá al panel' }),
  ).toBeTruthy()
  expect(data.getDashboard).not.toHaveBeenCalled()
  expect(
    screen.queryByRole('navigation', { name: 'Administración' }),
  ).toBeNull()
})
it('opens the pier report form from the general dashboard shortcut', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue(session)
  mount()
  fireEvent.click(
    await screen.findByRole('link', { name: 'Cargar parte del muelle' }),
  )
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Parte del muelle' }),
  ).toBeTruthy()
  expect(screen.getByLabelText(/Altura del río/)).toBeTruthy()
  expect(
    screen
      .getByRole('link', { name: 'Parte del muelle' })
      .getAttribute('aria-current'),
  ).toBe('page')
  expect(screen.queryByRole('link', { name: 'Altura del río' })).toBeNull()
})
it('gives pier staff a reduced panel without the general sections', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue({
    ...session,
    general: false,
    pier: true,
  })
  mount()
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Parte del muelle' }),
  ).toBeTruthy()
  expect(screen.getByText('Personal del muelle')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Roles y permisos' })).toBeNull()
  expect(data.getDashboard).not.toHaveBeenCalled()
})
it('requires MFA before rendering administrative data', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue({
    ...session,
    aal2: false,
    factorId: 'factor-test',
  })
  mount()
  expect(
    await screen.findByRole('heading', { name: 'Verificación en dos pasos' }),
  ).toBeTruthy()
  expect(data.getDashboard).not.toHaveBeenCalled()
})

it('verifies the MFA code before opening the general workspace', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue({
    ...session,
    aal2: false,
    factorId: 'factor-test',
  })
  vi.mocked(auth.verifyFactor).mockImplementation(() => {
    vi.mocked(auth.getAdminSession).mockResolvedValue(session)
    return Promise.resolve()
  })
  mount()
  fireEvent.change(await screen.findByLabelText('Código de seis dígitos'), {
    target: { value: '123456' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verificar e ingresar' }))
  expect(
    await screen.findByRole('heading', { name: 'Resumen del club' }),
  ).toBeTruthy()
  expect(auth.verifyFactor).toHaveBeenCalledWith('factor-test', '123456')
})

it('does not submit an invitation when paginating the role selector', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  const roles = Array.from({ length: 21 }, (_, index) => ({
    id: `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    name: `Rol ${index}`,
    is_system: false,
    permissions: [],
    created_at: '2026-11-08T00:00:00Z',
    updated_at: '2026-11-08T00:00:00Z',
  }))
  vi.mocked(data.listAdmin).mockResolvedValue(roles)
  mount(<UserEditor account={null} userId={session.id} onClose={() => {}} />)
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'new@example.test' },
  })
  fireEvent.click(await screen.findByLabelText('Rol 0'))
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  expect(await screen.findByText('Página 2')).toBeTruthy()
  expect(confirm).not.toHaveBeenCalled()
  expect(data.inviteUser).not.toHaveBeenCalled()
})
it('requires the existing MFA factor even during password recovery', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue({
    ...session,
    aal2: false,
    factorId: 'factor-test',
  })
  mount(<AdminPanel />, '/admin/establecer-clave')
  expect(
    await screen.findByRole('heading', { name: 'Verificación en dos pasos' }),
  ).toBeTruthy()
  expect(screen.queryByLabelText('Nueva contraseña')).toBeNull()
})
it.each([
  [{ ...session, active: false }, 'Acceso no habilitado'],
  [{ ...session, general: false, pier: false }, 'Cuenta configurada'],
])(
  'keeps unauthorized profiles outside the general panel',
  async (state, heading) => {
    vi.mocked(auth.getAdminSession).mockResolvedValue(state)
    mount()
    expect(await screen.findByRole('heading', { name: heading })).toBeTruthy()
    expect(data.getDashboard).not.toHaveBeenCalled()
  },
)
it('renders the general workspace for an authorized MFA session', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue(session)
  mount()
  expect(
    await screen.findByRole('heading', { name: 'Resumen del club' }),
  ).toBeTruthy()
  expect(
    await screen.findByText('Noticias publicadas o programadas'),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Roles y permisos' })).toHaveProperty(
    'href',
    expect.stringContaining('/admin/roles'),
  )
})
it('does not send mismatched passwords to Auth', async () => {
  mount(<PasswordForm />)
  fireEvent.change(screen.getByLabelText(/Nueva contraseña/), {
    target: { value: 'a-strong-password' },
  })
  fireEvent.change(screen.getByLabelText('Repetí la contraseña'), {
    target: { value: 'different-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Las contraseñas no coinciden.',
  )
  expect(auth.updatePassword).not.toHaveBeenCalled()
})

it('does not request an email change when the confirmation differs', async () => {
  mount(<EmailForm currentEmail="current@example.test" />)
  fireEvent.change(screen.getByLabelText('Nuevo correo electrónico'), {
    target: { value: 'new@example.test' },
  })
  fireEvent.change(screen.getByLabelText('Repetí el nuevo correo'), {
    target: { value: 'different@example.test' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Solicitar cambio de correo' }),
  )
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Los correos no coinciden.',
  )
  expect(auth.updateEmail).not.toHaveBeenCalled()
})

it('keeps the current email visible while its replacement awaits confirmation', async () => {
  vi.mocked(auth.updateEmail).mockResolvedValue(undefined)
  mount(<EmailForm currentEmail="current@example.test" />)
  fireEvent.change(screen.getByLabelText('Nuevo correo electrónico'), {
    target: { value: 'new@example.test' },
  })
  fireEvent.change(screen.getByLabelText('Repetí el nuevo correo'), {
    target: { value: 'new@example.test' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Solicitar cambio de correo' }),
  )
  expect(await screen.findByRole('status')).toHaveProperty(
    'textContent',
    expect.stringContaining('confirmar'),
  )
  expect(auth.updateEmail).toHaveBeenCalledWith('new@example.test')
  expect(screen.getByText('current@example.test')).toBeTruthy()
})
it('saves event drafts with Argentina time and no publication side effects', async () => {
  const close = vi.fn()
  vi.mocked(data.saveContent).mockResolvedValue(undefined)
  mount(<ContentEditor kind="events" row={null} onClose={close} />)
  fillEvent('Encuentro de prueba', 'Lugar de prueba')
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() =>
    expect(data.saveContent).toHaveBeenCalledWith(
      'events',
      {
        title: 'Encuentro de prueba',
        place: 'Lugar de prueba',
        description: null,
        starts_at: '2030-01-01T18:30:00.000Z',
        is_published: false,
      },
      null,
      null,
    ),
  )
  await waitFor(() => expect(close).toHaveBeenCalled())
})
it('does not publish when confirmation is canceled', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount(<ContentEditor kind="events" row={null} onClose={() => {}} />)
  fillEvent('Prueba', 'Prueba')
  fireEvent.click(screen.getByLabelText(/Publicar en el sitio/))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }))
  expect(confirm).toHaveBeenCalled()
  expect(data.saveContent).not.toHaveBeenCalled()
})
it('flags missing event fields and focuses the first one', () => {
  mount(<ContentEditor kind="events" row={null} onClose={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  expect(screen.getByText('Escribí un nombre para el evento.')).toBeTruthy()
  expect(screen.getByText('Elegí el día del evento.')).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByLabelText(/^Título/))
  expect(data.saveContent).not.toHaveBeenCalled()
})
function fillEvent(title: string, place: string) {
  fireEvent.change(screen.getByLabelText(/^Título/), {
    target: { value: title },
  })
  fireEvent.change(screen.getByLabelText(/^Lugar/), {
    target: { value: place },
  })
  fireEvent.change(screen.getByLabelText(/^Día/), {
    target: { value: '2030-01-01' },
  })
  fireEvent.change(screen.getByLabelText(/^Hora de inicio/), {
    target: { value: '15:30' },
  })
}

it('shows a custom role only the sections it was given', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue({
    ...session,
    general: false,
    pier: false,
    permissions: ['noticias.ver', 'usuarios.ver'],
  })
  vi.mocked(data.getDashboard).mockResolvedValue({
    news: 2,
    events: null,
    rates: null,
    drafts: 1,
    users: 3,
  })
  mount()
  const nav = await screen.findByRole('navigation', { name: 'Administración' })
  expect(within(nav).getByRole('link', { name: 'Noticias' })).toBeTruthy()
  expect(within(nav).getByRole('link', { name: 'Usuarios' })).toBeTruthy()
  for (const hidden of ['Eventos', 'Roles y permisos', 'Actividad'])
    expect(within(nav).queryByRole('link', { name: hidden })).toBeNull()
  expect(screen.getByText('Equipo del club')).toBeTruthy()
  expect(await screen.findByText('Usuarios activos')).toBeTruthy()
  expect(screen.queryByText('Próximos eventos publicados')).toBeNull()
  // Read-only users permission: no invitation button.
  fireEvent.click(within(nav).getByRole('link', { name: 'Usuarios' }))
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Usuarios' }),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Invitar usuario' })).toBeNull()
})

it('blocks a typed URL to a section outside the role', async () => {
  vi.mocked(auth.getAdminSession).mockResolvedValue({
    ...session,
    general: false,
    pier: false,
    permissions: ['noticias.ver'],
  })
  mount(<AdminPanel />, '/admin/roles')
  expect(
    await screen.findByRole('heading', { name: 'Sin acceso a esta sección' }),
  ).toBeTruthy()
})
