import { useEffect } from 'react'
import { supabase } from './supabase'
import { SUPABASE_CONFIGURED } from './auth'

export function useRealtime({ table, filter, onData }) {
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return

    const key = filter ? `${table}-${filter}` : table
    const config = { event: '*', schema: 'public', table }
    if (filter) config.filter = filter

    const channel = supabase
      .channel(`rt-${key}`)
      .on('postgres_changes', config, onData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, filter])
}
