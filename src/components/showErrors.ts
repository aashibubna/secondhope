import { createContext } from 'react'

/** Set to true once a form has tried to submit, so every field shows its error, not just touched ones. */
export const ShowErrors = createContext(false)
