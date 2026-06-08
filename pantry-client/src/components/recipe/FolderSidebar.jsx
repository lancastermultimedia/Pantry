import { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, MoreHorizontal, Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFolderStore } from '../../store/folderStore'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { useAuth } from '../../lib/auth'
import { NewFolderModal } from './NewFolderModal'

function FolderItem({ folder, recipeCount, onDrop, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(folder.name)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== folder.name) onRename(folder.id, trimmed)
    setIsEditing(false)
  }

  function handleDragOver(e) {
    e.preventDefault()
    if (e.dataTransfer.types.includes('recipe-id')) setIsDragOver(true)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const recipeId = e.dataTransfer.getData('recipe-id')
    if (recipeId) onDrop(recipeId, folder.id)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`group relative rounded-xl transition-colors ${isDragOver ? 'bg-[var(--pantry-green)]/10 ring-2 ring-[var(--pantry-green-light)]' : ''}`}
    >
      {isEditing ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: folder.color }} />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsEditing(false) }}
            maxLength={32}
            autoFocus
            className="flex-1 text-sm bg-white border border-[var(--pantry-green-light)] rounded-lg px-2 py-1 text-[var(--pantry-ink)] focus:outline-none"
          />
          <button onClick={commitRename} className="text-[var(--pantry-green)]"><Check size={14} /></button>
        </div>
      ) : (
        <NavLink
          to={`/recipes/folder/${folder.id}`}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              isActive
                ? 'bg-[var(--pantry-green)]/10 text-[var(--pantry-green)] font-semibold'
                : 'text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)]'
            }`
          }
        >
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: folder.color }} />
          <span className="flex-1 truncate" onDoubleClick={() => setIsEditing(true)}>{folder.name}</span>
          <span className="text-xs text-[var(--pantry-warm-grey)]">{recipeCount}</span>
        </NavLink>
      )}

      {/* Kebab menu */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu((v) => !v) }}
            className="p-1 rounded-lg text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)]"
          >
            <MoreHorizontal size={13} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg border border-[var(--pantry-border)] py-1 z-10"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => { setIsEditing(true); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--pantry-ink)] hover:bg-[var(--pantry-cream)]"
                >
                  Rename
                </button>
                <button
                  onClick={() => { onDelete(folder.id); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--pantry-accent)] hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Delete folder
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export function FolderSidebar() {
  const { folders, createFolder, updateFolder, deleteFolder, reorderFolders } = useFolderStore()
  const { allRecipes, setRecipeFolder } = useMealPlanStore()
  const { user } = useAuth()
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragFolderRef = useRef(null)

  const recipes = Object.values(allRecipes)
  const countFor = (folderId) => recipes.filter((r) => r.folder_id === folderId).length

  async function handleCreate({ name, color }) {
    await createFolder(user?.id ?? 'mock', { name, color })
  }

  async function handleRename(id, name) {
    await updateFolder(id, { name })
  }

  async function handleDelete(id) {
    await deleteFolder(id)
  }

  function handleDropOnFolder(recipeId, folderId) {
    setRecipeFolder(recipeId, folderId)
  }

  // Folder reordering
  function handleFolderDragStart(e, index) {
    dragFolderRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('folder-drag', '1')
  }

  function handleFolderDragOver(e, index) {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('folder-drag')) return
    setDragOverIndex(index)
  }

  function handleFolderDrop(e, index) {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('folder-drag')) return
    const from = dragFolderRef.current
    if (from === null || from === index) { setDragOverIndex(null); return }
    const reordered = [...folders]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(index, 0, moved)
    reorderFolders(reordered)
    setDragOverIndex(null)
    dragFolderRef.current = null
  }

  return (
    <>
      <aside className="w-52 flex-shrink-0 flex flex-col gap-1 pr-2">
        {/* All Recipes */}
        <NavLink
          to="/recipes"
          end
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              isActive
                ? 'bg-[var(--pantry-green)]/10 text-[var(--pantry-green)] font-semibold'
                : 'text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)]'
            }`
          }
        >
          <FolderOpen size={15} />
          <span className="flex-1">All Recipes</span>
          <span className="text-xs text-[var(--pantry-warm-grey)]">{recipes.length}</span>
        </NavLink>

        {folders.length > 0 && (
          <div className="h-px bg-[var(--pantry-border)] my-1" />
        )}

        {/* Folder list */}
        {folders.map((folder, index) => (
          <div
            key={folder.id}
            draggable
            onDragStart={(e) => handleFolderDragStart(e, index)}
            onDragOver={(e) => handleFolderDragOver(e, index)}
            onDrop={(e) => handleFolderDrop(e, index)}
            onDragEnd={() => setDragOverIndex(null)}
            className={`transition-transform ${dragOverIndex === index ? 'scale-[1.02]' : ''}`}
          >
            <FolderItem
              folder={folder}
              recipeCount={countFor(folder.id)}
              onDrop={handleDropOnFolder}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </div>
        ))}

        {/* New Folder */}
        <button
          onClick={() => setNewFolderOpen(true)}
          className="flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-sm text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-green)] hover:bg-[var(--pantry-border)] transition-colors"
        >
          <Plus size={14} /> New folder
        </button>
      </aside>

      <NewFolderModal
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onSave={handleCreate}
      />
    </>
  )
}
