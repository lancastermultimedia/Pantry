import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Folder, FolderMinus, Trash2, ChevronRight } from 'lucide-react'
import { useFolderStore } from '../../store/folderStore'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { useAuth } from '../../lib/auth'

export function RecipeContextMenu({ recipe, position, onClose }) {
  const { folders } = useFolderStore()
  const { setRecipeFolder, deleteRecipe } = useMealPlanStore()
  const { user } = useAuth()
  const [showFolders, setShowFolders] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Keep menu within viewport
  const menuWidth = 200
  const x = Math.min(position.x, window.innerWidth - menuWidth - 8)
  const y = Math.min(position.y, window.innerHeight - 240)

  async function handleMoveToFolder(folderId) {
    await setRecipeFolder(recipe.id, folderId)
    onClose()
  }

  async function handleDelete() {
    if (confirm(`Delete "${recipe.title}"? This cannot be undone.`)) {
      await deleteRecipe(recipe.id)
      onClose()
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[80] bg-white rounded-xl shadow-xl border border-[var(--pantry-border)] py-1 overflow-hidden"
      style={{ top: y, left: x, width: menuWidth }}
    >
      {!showFolders ? (
        <>
          <button
            onClick={() => setShowFolders(true)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-[var(--pantry-ink)] hover:bg-[var(--pantry-cream)] transition-colors"
          >
            <span className="flex items-center gap-2"><Folder size={14} /> Move to folder</span>
            <ChevronRight size={13} className="text-[var(--pantry-warm-grey)]" />
          </button>
          {recipe.folder_id && (
            <button
              onClick={() => handleMoveToFolder(null)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)] transition-colors"
            >
              <FolderMinus size={14} /> Remove from folder
            </button>
          )}
          <div className="h-px bg-[var(--pantry-border)] my-1" />
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--pantry-accent)] hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Delete recipe
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setShowFolders(false)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[var(--pantry-warm-grey)] uppercase tracking-wide hover:bg-[var(--pantry-cream)] transition-colors"
          >
            ← Move to folder
          </button>
          <div className="h-px bg-[var(--pantry-border)]" />
          {folders.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[var(--pantry-warm-grey)]">No folders yet.</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveToFolder(folder.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--pantry-cream)] transition-colors ${
                  recipe.folder_id === folder.id ? 'text-[var(--pantry-warm-grey)]' : 'text-[var(--pantry-ink)]'
                }`}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: folder.color }} />
                {folder.name}
                {recipe.folder_id === folder.id && <span className="ml-auto text-[10px] text-[var(--pantry-warm-grey)]">current</span>}
              </button>
            ))
          )}
        </>
      )}
    </div>,
    document.body
  )
}
