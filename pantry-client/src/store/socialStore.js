import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { SUPABASE_CONFIGURED } from '../lib/auth'

// ── Mock data ─────────────────────────────────────────────────

const MOCK_PROFILE = {
  id: 'mock',
  display_name: 'Demo User',
  email: 'demo@pantry.app',
  avatar_url: null,
  is_searchable: true,
  digest_enabled: true,
  digest_send_day: 'sunday',
  digest_send_time: '18:00',
}

const MOCK_CONNECTIONS = [
  { id: 'conn1', requester_id: 'u2', addressee_id: 'mock', status: 'accepted',
    other_user: { id: 'u2', display_name: 'Jamie Oliver', email: 'jamie@example.com', avatar_url: null } },
  { id: 'conn2', requester_id: 'mock', addressee_id: 'u3', status: 'accepted',
    other_user: { id: 'u3', display_name: 'Ina Garten', email: 'ina@example.com', avatar_url: null } },
]

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'shared_pantry_accepted', read: false,
    payload: { from_name: 'Jamie Oliver', from_id: 'u2' },
    created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'n2', type: 'recipe_added_to_calendar', read: false,
    payload: { from_name: 'Jamie Oliver', recipe_title: 'Lemon Pasta', calendar_name: 'Our Week', plan_id: 'sp1' },
    created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'n3', type: 'shared_pantry_request', read: true,
    payload: { from_name: 'Ina Garten', from_id: 'u3', request_id: 'req1' },
    created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
]

// ── Helpers ───────────────────────────────────────────────────

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export { initials }

function getNotificationText(n) {
  const p = n.payload
  switch (n.type) {
    case 'shared_pantry_request':
      return { text: `${p.from_name} wants to share a Pantry with you`, link: '/people' }
    case 'shared_pantry_accepted':
      return { text: `${p.from_name} accepted your Shared Pantry request`, link: '/people' }
    case 'calendar_invite':
      return { text: `${p.from_name} invited you to "${p.calendar_name}"`, link: `/shared/${p.plan_id}` }
    case 'folder_invite':
      return { text: `${p.from_name} shared their "${p.folder_name}" folder with you`, link: `/recipes/folder/${p.folder_id}` }
    case 'recipe_added_to_calendar':
      return { text: `${p.from_name} added ${p.recipe_title} to ${p.calendar_name}`, link: `/shared/${p.plan_id}` }
    case 'recipe_added_to_folder':
      return { text: `${p.from_name} added ${p.recipe_title} to ${p.folder_name}`, link: `/recipes/folder/${p.folder_id}` }
    default:
      return { text: 'New notification', link: '/' }
  }
}

export { getNotificationText }

// ── Store ─────────────────────────────────────────────────────

export const useSocialStore = create((set, get) => ({
  profile: SUPABASE_CONFIGURED ? null : MOCK_PROFILE,
  profileLoading: false,
  connections: SUPABASE_CONFIGURED ? [] : MOCK_CONNECTIONS,
  pendingIncoming: [],
  pendingOutgoing: [],
  searchResults: [],
  notifications: SUPABASE_CONFIGURED ? [] : MOCK_NOTIFICATIONS,
  unreadCount: SUPABASE_CONFIGURED ? 0 : MOCK_NOTIFICATIONS.filter((n) => !n.read).length,

  // ── Profile ──────────────────────────────────────────────────

  loadProfile: async (userId) => {
    if (!SUPABASE_CONFIGURED) return
    set({ profileLoading: true })
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    set({ profile: data ?? null, profileLoading: false })
  },

  upsertProfile: async (userId, updates) => {
    if (!SUPABASE_CONFIGURED) {
      set((s) => ({ profile: { ...s.profile, ...updates } }))
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates })
      .select()
      .single()
    if (error) throw error
    set({ profile: data })
  },

  uploadAvatar: async (userId, file) => {
    if (!SUPABASE_CONFIGURED) return null
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl
    await get().upsertProfile(userId, { avatar_url: url })
    return url
  },

  // ── Search ───────────────────────────────────────────────────

  searchProfiles: async (query) => {
    if (!SUPABASE_CONFIGURED) {
      const results = MOCK_CONNECTIONS.map((c) => c.other_user).filter((u) =>
        u.display_name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
      set({ searchResults: results })
      return
    }
    if (!query.trim()) { set({ searchResults: [] }); return }
    const { data = [] } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)
    set({ searchResults: data })
  },

  clearSearch: () => set({ searchResults: [] }),

  // ── Shared Pantry requests ────────────────────────────────────

  loadConnections: async (userId) => {
    if (!SUPABASE_CONFIGURED) return
    const { data = [] } = await supabase
      .from('shared_pantry_requests')
      .select(`
        id, requester_id, addressee_id, status, created_at,
        requester:profiles!requester_id(id, display_name, email, avatar_url),
        addressee:profiles!addressee_id(id, display_name, email, avatar_url)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    const accepted = data
      .filter((r) => r.status === 'accepted')
      .map((r) => ({
        ...r,
        other_user: r.requester_id === userId ? r.addressee : r.requester,
      }))

    const incoming = data.filter((r) => r.status === 'pending' && r.addressee_id === userId)
      .map((r) => ({ ...r, other_user: r.requester }))

    const outgoing = data.filter((r) => r.status === 'pending' && r.requester_id === userId)
      .map((r) => ({ ...r, other_user: r.addressee }))

    set({ connections: accepted, pendingIncoming: incoming, pendingOutgoing: outgoing })
  },

  sendPantryRequest: async (userId, addresseeId) => {
    if (!SUPABASE_CONFIGURED) return
    await supabase.from('shared_pantry_requests').insert({ requester_id: userId, addressee_id: addresseeId })
    // Insert notification for addressee
    await supabase.from('notifications').insert({
      user_id: addresseeId,
      type: 'shared_pantry_request',
      payload: { from_id: userId, request_id: '' },
    })
    await get().loadConnections(userId)
  },

  respondToRequest: async (userId, requestId, accept) => {
    if (!SUPABASE_CONFIGURED) return
    const status = accept ? 'accepted' : 'declined'
    const { data } = await supabase
      .from('shared_pantry_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single()
    if (accept && data) {
      const profile = get().profile
      await supabase.from('notifications').insert({
        user_id: data.requester_id,
        type: 'shared_pantry_accepted',
        payload: { from_name: profile?.display_name ?? 'Someone', from_id: userId },
      })
    }
    await get().loadConnections(userId)
  },

  cancelRequest: async (userId, requestId) => {
    if (!SUPABASE_CONFIGURED) return
    await supabase.from('shared_pantry_requests').delete().eq('id', requestId)
    await get().loadConnections(userId)
  },

  removeConnection: async (userId, connectionId) => {
    if (!SUPABASE_CONFIGURED) {
      set((s) => ({ connections: s.connections.filter((c) => c.id !== connectionId) }))
      return
    }
    await supabase.from('shared_pantry_requests').delete().eq('id', connectionId)
    await get().loadConnections(userId)
  },

  // ── Notifications ─────────────────────────────────────────────

  loadNotifications: async (userId) => {
    if (!SUPABASE_CONFIGURED) return
    const { data = [] } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    set({ notifications: data, unreadCount: data.filter((n) => !n.read).length })
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 20),
      unreadCount: s.unreadCount + (notification.read ? 0 : 1),
    }))
  },

  markRead: async (userId, notificationId) => {
    if (SUPABASE_CONFIGURED) {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    }
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllRead: async (userId) => {
    if (SUPABASE_CONFIGURED) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    }
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },
}))
