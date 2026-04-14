"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import Link from 'next/link'

type Contact = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: string
  created_at: string
}

export default function AdminContactsPage() {
  const { user, userRole, loading } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'closed'>('all')
  const [fetching, setFetching] = useState(false)

  const load = async () => {
    setFetching(true)
    let query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    const { data, error } = await query
    setFetching(false)
    if (error) {
      console.error(error)
      toast.error('Failed to load messages')
      return
    }
    setContacts((data || []) as Contact[])
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const updateStatus = async (id: string, status: 'new' | 'read' | 'closed') => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
    if (error) {
      console.error(error)
      toast.error('Failed to update')
      return
    }
    toast.success('Updated')
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  if (loading) return null
  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-gray-700">
            Access denied. Admin privileges required.
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Filter</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-md border-gray-300 text-sm">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {fetching ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-gray-600">No messages.</div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.email}</div>
                        <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.subject || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md break-words">{c.message}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {c.status !== 'read' && (
                            <button onClick={() => updateStatus(c.id, 'read')} className="px-3 py-1 text-xs rounded-md border text-gray-700 hover:bg-gray-50">Mark Read</button>
                          )}
                          {c.status !== 'closed' && (
                            <button onClick={() => updateStatus(c.id, 'closed')} className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700">Close</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

