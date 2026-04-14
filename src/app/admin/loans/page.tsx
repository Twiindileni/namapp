"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

type LoanStatus = 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'defaulted'

interface Loan {
  id: string
  applicant_name: string
  phone: string
  email: string | null
  amount: number
  repayment_amount: number
  collateral_type: 'fridge' | 'phone' | 'laptop' | null
  collateral_description: string | null
  status: LoanStatus
  created_at: string
}

export default function AdminLoansPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | LoanStatus>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setLoans((data || []) as Loan[])
      } catch (err) {
        console.error(err)
        toast.error('Failed to load loans')
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }
    load()
  }, [userRole, authLoading])

  const updateStatus = async (loanId: string, status: LoanStatus) => {
    const now = new Date().toISOString()
    const updates: any = { status }
    if (status === 'approved') updates.approved_at = now
    if (status === 'disbursed') updates.disbursed_at = now
    if (status === 'repaid') updates.repaid_at = now
    if (status === 'defaulted') updates.defaulted_at = now
    const { error } = await supabase.from('loans').update(updates).eq('id', loanId)
    if (error) {
      console.error(error)
      toast.error('Failed to update status')
      return
    }
    toast.success('Status updated')
    setLoans(prev => prev.map(l => (l.id === loanId ? { ...l, status } : l)))
  }

  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter)

  const statusLabel = (status: LoanStatus) => {
    switch (status) {
      case 'pending':
        return 'pending'
      case 'approved':
        return 'approved'
      case 'rejected':
        return 'rejected'
      case 'disbursed':
        return 'pending repayment'
      case 'repaid':
        return 'repaid'
      case 'defaulted':
        return 'defaulted'
      default:
        return status
    }
  }

  const actionOptionsFor = (loan: Loan): { value: LoanStatus; label: string }[] => {
    // Contextual actions based on current status
    if (loan.status === 'pending') {
      return [
        { value: 'approved', label: 'Approve' },
        { value: 'rejected', label: 'Reject' }
      ]
    }
    if (loan.status === 'approved') {
      return [
        { value: 'disbursed', label: 'Mark Pending Repayment' }
      ]
    }
    if (loan.status === 'disbursed') {
      return [
        { value: 'repaid', label: 'Mark Repaid' },
        { value: 'defaulted', label: 'Mark Defaulted' }
      ]
    }
    // For terminal states, allow no-op or corrections
    if (loan.status === 'repaid' || loan.status === 'defaulted' || loan.status === 'rejected') {
      return []
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disbursed">Disbursed</option>
            <option value="repaid">Repaid</option>
            <option value="defaulted">Defaulted</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repayment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collateral</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{loan.applicant_name}</div>
                    <div className="text-xs text-gray-500">{new Date(loan.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{loan.phone}</div>
                    {loan.email && <div className="text-xs text-gray-500">{loan.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">N${loan.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">N${loan.repayment_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {loan.collateral_type ? (
                      <div>
                        <div className="capitalize">{loan.collateral_type}</div>
                        {loan.collateral_description && (
                          <div className="text-xs text-gray-500 line-clamp-2">{loan.collateral_description}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                      {statusLabel(loan.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {actionOptionsFor(loan).length > 0 ? (
                      <select
                        aria-label="Change status"
                        defaultValue=""
                        onChange={(e) => {
                          const value = e.target.value as LoanStatus
                          if (!value) return
                          updateStatus(loan.id, value)
                          e.currentTarget.value = ''
                        }}
                        className="rounded-md border-gray-300 bg-white px-3 py-1.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="" disabled>Choose action…</option>
                        {actionOptionsFor(loan).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={7}>No loans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


