import type { ReactNode } from 'react'
import { club } from '@/shared/config/club'
import { PAGES } from '@/shared/seo/pages.mjs'
import { container } from '@/shared/ui/layout'
import { PageHeader } from '@/shared/ui/PageHeader'

// Ley 25.326 (art. 6) asks to tell people who holds their data, what for and how to
// exercise their rights; Disposición DNPDP 10/2008 asks for the two quoted legends.
// Change the date at the bottom whenever this text changes.

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-2xl font-extrabold text-navy-900">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  )
}

const list = 'grid list-disc gap-2 pl-6'
function Contact() {
  return (
    <a href={club.whatsappUrl} className="font-bold text-river-600 underline">
      por WhatsApp al {club.phone}
    </a>
  )
}

export default function PrivacyPage() {
  return (
    <>
      <title>{PAGES.privacy.title}</title>
      <meta name="description" content={PAGES.privacy.description} />
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}${PAGES.privacy.path}`}
      />
      <PageHeader
        title="Privacidad"
        description="Qué datos personales usa el club en este sitio y cómo pedir que los corrijamos o los quitemos."
      />
      <div
        className={`${container} max-w-3xl py-12 text-lg leading-8 text-navy-900 lg:py-16`}
      >
        <Block title="Responsable">
          <p>
            Los datos los maneja el {club.name} (CUIT 33-70744615-9), con
            domicilio en {club.address}.
          </p>
          <p>
            Para cualquier consulta o pedido sobre tus datos, escribinos{' '}
            <Contact />.
          </p>
        </Block>

        <Block title="Qué publicamos en el sitio">
          <ul className={list}>
            <li>
              Tablas de torneos y tablas anuales: tu nombre y la inicial de tu
              apellido, con tus puntos y tu posición. Se publican cuando te
              inscribís en un torneo.
            </li>
            <li>
              Fotos y videos de noticias, torneos y partes del muelle, en los
              que pueden aparecer socios y visitantes.
            </li>
          </ul>
        </Block>

        <Block title="Qué guardamos sin publicar">
          <ul className={list}>
            <li>
              Para los torneos: nombre, apellido y DNI. El DNI sirve para no
              confundir a dos personas con el mismo nombre al sumar los puntos
              del año. No se muestra en el sitio.
            </li>
            <li>
              Para las personas que administran el sitio: su correo y un
              registro de los cambios que hacen en el panel.
            </li>
          </ul>
          <p>
            Usamos estos datos solo para organizar los torneos, publicar sus
            resultados e informar las actividades del club. No los vendemos ni
            los usamos para publicidad.
          </p>
          <p>
            Los datos y los resultados de los torneos se guardan hasta que un
            administrador del club los borra o hasta que nos pidas que los
            quitemos.
          </p>
        </Block>

        <Block title="Servicios que usamos">
          <p>
            Para que el sitio funcione, los datos pasan por estos proveedores,
            que pueden guardarlos en servidores fuera de Argentina:
          </p>
          <ul className={list}>
            <li>Supabase: base de datos y archivos de fotos y videos.</li>
            <li>Vercel: alojamiento del sitio.</li>
            <li>
              Cloudflare: verificación contra robots en el ingreso al panel de
              administración.
            </li>
            <li>Resend: correos de acceso al panel de administración.</li>
          </ul>
        </Block>

        <Block title="Cookies y datos en tu navegador">
          <p>
            El sitio público no usa cookies ni herramientas de estadísticas o
            publicidad. Solo guarda una marca técnica mientras tenés la página
            abierta, para recargarla si falla una actualización del sitio.
          </p>
          <p>
            El panel de administración guarda en el navegador la sesión de quien
            ingresa y los borradores que todavía no se guardaron.
          </p>
        </Block>

        <Block title="Cómo pedir que corrijamos o quitemos un dato">
          <p>
            Podés pedirnos ver qué datos tuyos tenemos, corregirlos o que
            quitemos tu nombre o una foto en la que aparecés. Escribinos{' '}
            <Contact /> e indicá de qué dato, torneo o foto se trata.
          </p>
          <p>
            Respondemos los pedidos de acceso dentro de los 10 días corridos y
            los de corrección o eliminación dentro de los 5 días hábiles, como
            fija la Ley 25.326.
          </p>
          <p className="text-base leading-7 text-ink-600">
            El titular de los datos personales tiene la facultad de ejercer el
            derecho de acceso a los mismos en forma gratuita a intervalos no
            inferiores a seis meses, salvo que se acredite un interés legítimo
            al efecto conforme lo establecido en el artículo 14, inciso 3 de la
            Ley N° 25.326. La Agencia de Acceso a la Información Pública, en su
            carácter de Órgano de Control de la Ley N° 25.326, tiene la
            atribución de atender las denuncias y reclamos que interpongan
            quienes resulten afectados en sus derechos por incumplimiento de las
            normas vigentes en materia de protección de datos personales.
          </p>
          <p>
            <a
              href="https://www.argentina.gob.ar/aaip/datospersonales"
              className="font-bold text-river-600 underline"
            >
              Ver cómo hacer un reclamo ante la Agencia de Acceso a la
              Información Pública
            </a>
          </p>
        </Block>

        <p className="mt-12 border-t border-navy-900/10 pt-6 text-base text-ink-600">
          Última actualización: 24 de noviembre de 2026.
        </p>
      </div>
    </>
  )
}
