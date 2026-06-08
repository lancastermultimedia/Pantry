import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { SUPABASE_CONFIGURED } from '../lib/auth'

export const FOLDER_COLORS = [
  '#2D5016', // forest green
  '#4A7C28', // light green
  '#C4622D', // terracotta
  '#E0956B', // light terracotta
  '#5B8DB8', // slate blue
  '#9B6B9B', // muted purple
  '#B8845B', // warm caramel
  '#6B8C7A', // sage green
]

const MOCK_FOLDERS = [
  { id: 'folder1', user_id: 'mock', name: 'Quick Weeknights', color: '#2D5016' },
  { id: 'folder2', user_id: 'mock', name: 'Weekend Brunch', color: '#C4622D' },
]

const ORDER_KEY = 'pantry-folder-order'

function loadOrder() {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || 'null') } catch { return null }
}

function saveOrder(folders) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(folders.map((f) => f.id)))
}

function applyOrder(folders) {
  const order = loadOrder()
  if (!order) return folders
  const map = Object.fromEntries(folders.map((f) => [f.id, f]))
  const ordered = order.map((id) => map[id]).filter(Boolean)
  const added = folders.filter((f) => !order.includes(f.id))
  return [...ordered, ...added]
}

export const useFolderStore = create((set, get) => ({
  folders: SUPABASE_CONFIGURED ? [] : MOCK_FOLDERS,
  loading: false,

  loadFolders: async (userId) => {
    if (!SUPABASE_CONFIGURED) return
    set({ loading: true })
    const { data = [] } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    set({ folders: applyOrder(data), loading: false })
  },

  createFolder: async (userId, { name, color }) => {
    if (!SUPABASE_CONFIGURED) {
      const folder = { id: `folder_${Date.now()}`, user_id: userId, name, color }
      set((s) => {
        const folders = [...s.folders, folder]
        saveOrder(folders)
        return { folders }
      })
      return folder
    }
    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: userId, name, color })
      .select()
      .single()
    if (error) throw error
    set((s) => {
      const folders = [...s.folders, data]
      saveOrder(folders)
      return { folders }
    })
    return data
  },

  updateFolder: async (id, updates) => {
    if (SUPABASE_CONFIGURED) {
      await supabase.from('folders').update(updates).eq('id', id)
    }
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }))
  },

  deleteFolder: async (id) => {
    if (SUPABASE_CONFIGURED) {
      await supabase.from('folders').delete().eq('id', id)
    }
    set((s) => {
      const folders = s.folders.filter((f) => f.id !== id)
      saveOrder(folders)
      return { folders }
    })
  },

  reorderFolders: (folders) => {
    saveOrder(folders)
    set({ folders })
  },
}))
