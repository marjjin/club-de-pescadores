import type { ReactNode } from 'react'
import { Link } from 'react-router'
import logo from '@/shared/assets/images/logo-192.webp'

export function AccessFrame({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-mist-50 lg:grid-cols-2">
      <section className="relative flex flex-col justify-center bg-navy-950 px-8 py-10 text-white sm:px-16 lg:py-20">
        <Link to="/" className="mb-12 flex items-center gap-4">
          <img src={logo} width="64" height="64" alt="" />
          <span className="font-extrabold">
            Club de Pescadores
            <span className="block text-sm font-normal text-white/70">
              San Nicolás
            </span>
          </span>
        </Link>
        <p className="text-xs font-bold tracking-[0.25em] text-sun-400 uppercase">
          Administración
        </p>
        <h1 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">
          El club, conectado.
        </h1>
        <p className="mt-5 max-w-sm leading-relaxed text-white/75">
          Un espacio para cuidar el contenido del club y organizar el trabajo
          del equipo.
        </p>
        <div
          aria-hidden="true"
          className="mt-10 h-1 w-16 rounded-full bg-sun-400"
        />
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-navy-900/10 bg-white p-6 shadow-card sm:p-9">
          {children}
        </div>
      </section>
    </main>
  )
}
