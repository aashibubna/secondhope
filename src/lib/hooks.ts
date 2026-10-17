import { useEffect, useState } from 'react'
import type { Application, Company, Job } from '../types'
import {
  watchCompany,
  watchCompanyApplications,
  watchCompanyJobs,
  watchMyApplications,
  watchOpenJobs,
} from './db'

interface Live<T> {
  data: T
  loading: boolean
}

/** Subscribes while `key` is set; resets to `initial` whenever the key changes. */
function useLive<T>(key: string | null | undefined, initial: T, subscribe: (key: string, set: (v: T) => void) => () => void) {
  const [state, setState] = useState<{ key: string | null | undefined; data: T; loading: boolean }>({
    key,
    data: initial,
    loading: !!key,
  })

  useEffect(() => {
    if (!key) return
    return subscribe(key, (data) => setState({ key, data, loading: false }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (state.key !== key) return { data: initial, loading: !!key } as Live<T>
  return { data: state.data, loading: state.loading } as Live<T>
}

const byNewest = <T extends { createdAt: number }>(rows: T[]) => [...rows].sort((a, b) => b.createdAt - a.createdAt)

const NONE: never[] = []

export const useOpenJobs = () => useLive<Job[]>('all', NONE, (_, set) => watchOpenJobs((j) => set(byNewest(j)), () => set([])))

export const useCompany = (id: string | undefined) => useLive<Company | null>(id, null, watchCompany)

export const useCompanyJobs = (id: string | undefined, openOnly = false) =>
  useLive<Job[]>(id ? `${id}:${openOnly}` : null, NONE, (_, set) => watchCompanyJobs(id!, (j) => set(byNewest(j)), openOnly))

export const useMyApplications = (uid: string | undefined) =>
  useLive<Application[]>(uid, NONE, (k, set) => watchMyApplications(k, (a) => set(byNewest(a))))

export const useCompanyApplications = (id: string | undefined) =>
  useLive<Application[]>(id, NONE, (k, set) => watchCompanyApplications(k, (a) => set(byNewest(a))))
