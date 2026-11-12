import { Component } from 'react'
import { button } from './button'
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
          className="grid min-h-[50vh] content-center justify-items-center gap-5 p-8 text-center"
        >
          <p className="max-w-md text-lg text-navy-900">
            Ocurrió un problema al cargar la página. Revisá tu conexión e
            intentá nuevamente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={button.secondary}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
