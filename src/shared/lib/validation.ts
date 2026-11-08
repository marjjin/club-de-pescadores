import { z } from 'zod'

// Avoid runtime code generation and CSP violation reports in the browser.
z.config({ jitless: true })

export { z }
