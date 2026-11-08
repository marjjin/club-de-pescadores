import logo192 from '@/shared/assets/images/logo-192.webp'
import styles from './PageLoading.module.css'

export function PageLoading() {
  return (
    <main
      aria-label="Cargando página"
      className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-mist-50 px-6 py-20"
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-8 grid size-40 place-items-center">
          <span aria-hidden="true" className={styles.orbit} />
          <div className="grid size-32 place-items-center rounded-full bg-white shadow-card">
            <img src={logo192} alt="" width="96" height="96" />
          </div>
        </div>
        <p className="text-xs font-extrabold tracking-[0.28em] text-ink-600 uppercase">
          San Nicolás
        </p>
        <p className="mt-3 font-display text-3xl leading-tight text-navy-900 sm:text-4xl">
          Club de Pescadores
        </p>
        <span
          aria-hidden="true"
          className="mt-5 h-1 w-10 rounded-full bg-sun-400"
        />
        <p
          role="status"
          className="mt-6 flex items-center gap-3 text-sm text-ink-600"
        >
          Preparando tu visita
          <span aria-hidden="true" className={styles.dots}>
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
      <div aria-hidden="true" className={styles.river}>
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className={styles.wave}
        >
          <path d="M0 50 Q150 0 300 50 T600 50 T900 50 T1200 50 V120 H0Z" />
        </svg>
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className={styles.wave}
        >
          <path d="M0 50 Q150 100 300 50 T600 50 T900 50 T1200 50 V120 H0Z" />
        </svg>
      </div>
    </main>
  )
}
