import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="grid justify-items-center gap-4 p-8 text-center"
        >
          <p className="text-lg">
            Ocurrió un problema al cargar la página. Revisá tu conexión e
            intentá nuevamente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-12 rounded-md bg-navy-900 px-6 font-bold text-white hover:bg-navy-800"
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
