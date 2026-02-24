import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, Search, Loader2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

import Navbar from './Navbar'
import { useAuth } from '../hooks/useAuth'
import { useGroups } from '../hooks/useGroups'
import { createGroup, addMemberToGroup } from '../services/groupService'
import { findUserByEmail } from '../services/userService'

function Avatar({ member, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  if (member.photoURL) {
    return <img src={member.photoURL} alt={member.displayName} className={`${sz} rounded-full ring-2 ring-slate-200 dark:ring-slate-800 object-cover`} />
  }
  return (
    <div className={`${sz} rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center font-semibold text-blue-300`}>
      {(member.displayName || member.email || '?')[0].toUpperCase()}
    </div>
  )
}

function CreateGroupModal({ currentUser, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [members, setMembers] = useState([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)

  const addMember = async () => {
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    if (email === currentUser.email?.toLowerCase()) {
      toast.error("That's your own email — you're added automatically.")
      setEmailInput('')
      return
    }
    if (members.find((m) => m.email === email)) {
      toast.error('Already added')
      setEmailInput('')
      return
    }
    setSearching(true)
    try {
      const found = await findUserByEmail(email)
      if (!found) {
        toast.error('No user found with that email. They need to sign up first.')
        return
      }
      setMembers((prev) => [...prev, found])
      setEmailInput('')
    } catch {
      toast.error('Error looking up user')
    } finally {
      setSearching(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Enter a group name'); return }
    setCreating(true)
    try {
      const groupId = await createGroup(name, currentUser)
      for (const m of members) {
        await addMemberToGroup(groupId, m)
      }
      toast.success(`Group "${name}" created!`)
      onCreated(groupId)
    } catch {
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="glass-card w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold font-heading text-slate-900 dark:text-white">New Group</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group name */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 block">Group name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Weekend trip, Flatmates..."
            className="w-full bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
            autoFocus
          />
        </div>

        {/* Add members */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 block">Add members by email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              placeholder="friend@example.com"
              className="flex-1 bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
            />
            <button
              onClick={addMember}
              disabled={searching || !emailInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-body"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Members list */}
        {members.length > 0 && (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.uid} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
                <div className="flex items-center gap-2.5">
                  <Avatar member={m} />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-body">{m.displayName || m.email}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-body">{m.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMembers((prev) => prev.filter((x) => x.uid !== m.uid))}
                  className="p-1 rounded-lg text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold font-heading transition-colors flex items-center justify-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Group
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function Groups() {
  const { user } = useAuth()
  const { groups, loading } = useGroups(user?.uid)
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/4 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Groups</h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 font-body">Split expenses with friends</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold font-heading transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </motion.div>

        {/* Group cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-heading font-semibold mb-1">No groups yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-body mb-5">
              Create a group to split expenses with friends or housemates.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold font-heading transition-colors"
            >
              Create your first group
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, i) => (
              <motion.button
                key={group.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="glass-card p-5 text-left hover:border-slate-300 dark:hover:border-slate-600/60 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors mt-1" />
                </div>
                <p className="text-base font-semibold font-heading text-slate-900 dark:text-white mb-1 truncate">
                  {group.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-body mb-4">
                  {group.members?.length || 1} member{(group.members?.length || 1) !== 1 ? 's' : ''}
                </p>
                <div className="flex -space-x-2">
                  {(group.members || []).slice(0, 5).map((m) => (
                    <Avatar key={m.uid} member={m} />
                  ))}
                  {(group.members?.length || 0) > 5 && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-body">
                      +{group.members.length - 5}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateGroupModal
            currentUser={user}
            onClose={() => setShowCreate(false)}
            onCreated={(id) => { setShowCreate(false); navigate(`/groups/${id}`) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
