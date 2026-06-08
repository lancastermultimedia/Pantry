import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FOLDER_COLORS } from '../../store/folderStore'

export function NewFolderModal({ isOpen, onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? FOLDER_COLORS[0])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) { setError('Folder name is required.'); return }
    if (trimmed.length > 32) { setError('Name must be 32 characters or fewer.'); return }
    setSaving(true)
    await onSave({ name: trimmed, color })
    setSaving(false)
    setName('')
    setColor(FOLDER_COLORS[0])
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit folder' : 'New folder'}>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">
            Folder name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Quick Weeknights"
            maxLength={32}
            autoFocus
            className="w-full px-4 py-2.5 text-sm bg-white border border-[var(--pantry-border)] rounded-xl text-[var(--pantry-ink)] placeholder-[var(--pantry-warm-grey)] focus:outline-none focus:border-[var(--pantry-green-light)]"
          />
          {error && <p className="text-xs text-[var(--pantry-accent)]">{error}</p>}
          <p className="text-[11px] text-[var(--pantry-warm-grey)]">{name.length}/32</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">
            Colour
          </label>
          <div className="flex gap-2 flex-wrap">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-[var(--pantry-ink)] scale-110' : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-border)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-xl font-medium text-white transition-colors disabled:opacity-40"
            style={{ background: color }}
          >
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Create folder'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
