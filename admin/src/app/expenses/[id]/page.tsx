'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText, 
  Clock,
  Pencil,
  Trash2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/lib/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const EXPENSE_CATEGORIES = [
  'Inventory & Stock',
  'Rent & Utilities',
  'Salaries & Wages',
  'Marketing & Advertising',
  'Shipping & Delivery',
  'Equipment & Supplies',
  'Software & Subscriptions',
  'Maintenance & Repairs',
  'Insurance',
  'Taxes & Fees',
  'Professional Services',
  'Other',
]

const FREQUENCIES = [
  { value: 'one-time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

function formatTZS(n: number | string | null | undefined) {
  const v = Number(n ?? 0)
  return `TZS ${v.toLocaleString()}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ExpenseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<{
    amount: string
    category: string
    description: string
    expense_date: string
    frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    notes: string
  }>({
    amount: '',
    category: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    frequency: 'one-time',
    notes: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchExpense(params.id as string)
    }
  }, [params.id])

  const fetchExpense = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/expenses/${id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setExpense(data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load expense details',
          variant: 'destructive'
        })
        router.push('/expenses')
      }
    } catch (error) {
      console.error('Failed to fetch expense:', error)
      toast({
        title: 'Error',
        description: 'Network error loading expense',
        variant: 'destructive'
      })
      router.push('/expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEdit = () => {
    if (!expense) return
    
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      expense_date: expense.expense_date,
      frequency: expense.frequency,
      notes: expense.notes || '',
    })
    setIsEditDialogOpen(true)
    setError('')
  }

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false)
    setError('')
    setFormData({
      amount: '',
      category: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      frequency: 'one-time',
      notes: '',
    })
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.amount || !formData.category || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    if (!expense) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (response.ok) {
        const updatedExpense = await response.json()
        setExpense(updatedExpense)
        handleCloseEdit()
        toast({
          title: 'Expense Updated',
          description: 'The expense has been updated successfully.',
        })
      } else {
        const data = await response.json().catch(() => ({ error: 'Failed to update expense' }))
        setError(data.error || 'Failed to update expense')
      }
    } catch (error) {
      setError('An error occurred while updating the expense')
      console.error('Error updating expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!expense) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Expense Deleted',
          description: 'The expense has been deleted successfully.',
        })
        router.push('/expenses')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to delete expense',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the expense',
        variant: 'destructive',
      })
      console.error('Error deleting expense:', error)
    } finally {
      setDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading expense details...</p>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Expense not found</p>
          <Button onClick={() => router.push('/expenses')} className="mt-4">
            Back to Expenses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/expenses')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expense Details</h1>
            <p className="text-sm text-muted-foreground mt-1">View complete expense information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Amount Card */}
        <Card className="border-2 border-primary bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <DollarSign className="h-5 w-5" />
              Expense Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{formatTZS(expense.amount)}</div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Category</span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {expense.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Frequency</span>
                </div>
                <Badge variant="outline" className="text-sm capitalize">
                  {expense.frequency}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Expense Date</span>
                </div>
                <p className="font-semibold">{formatDate(expense.expense_date)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Created</span>
                </div>
                <p className="text-sm">{formatDateTime(expense.created_at)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Description</span>
              </div>
              <p className="text-base">{expense.description}</p>
            </div>

            {expense.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Notes</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-sm whitespace-pre-wrap">{expense.notes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expense ID:</span>
              <span className="font-mono text-xs">{expense.id}</span>
            </div>
            {expense.updated_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{formatDateTime(expense.updated_at)}</span>
              </div>
            )}
            {expense.receipt_url && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Receipt:</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => window.open(expense.receipt_url!, '_blank')}
                  className="h-auto p-0"
                >
                  View Receipt →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (TZS) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Office rent for January"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expense_date">Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this expense..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEdit} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Update Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete this expense. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
