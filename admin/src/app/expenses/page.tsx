'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, DollarSign, Calendar, Tag, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/lib/database"

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
    month: 'short',
    day: 'numeric'
  })
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      // Add timestamp to bust cache
      const response = await fetch(`/api/expenses?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched expenses:', data.length, data)
        setExpenses(data)
      } else {
        console.error('Failed to fetch expenses:', response.status)
        toast({
          title: 'Error',
          description: 'Failed to load expenses',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
      toast({
        title: 'Error',
        description: 'Network error loading expenses',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.amount || !formData.category || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (response.ok) {
        const savedExpense = await response.json()
        console.log('Expense saved:', savedExpense)
        
        // Close dialog first
        handleCloseDialog()
        
        // Small delay to ensure DB write completes
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Then fetch fresh data
        await fetchExpenses()
        
        toast({
          title: editingExpense ? 'Expense Updated' : 'Expense Added',
          description: editingExpense 
            ? 'The expense has been updated successfully.' 
            : 'The expense has been added successfully.',
        })
      } else {
        const data = await response.json().catch(() => ({ error: 'Failed to save expense' }))
        setError(data.error || 'Failed to save expense')
        toast({
          title: 'Error',
          description: data.error || 'Failed to save expense',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setError('An error occurred while saving the expense')
      toast({
        title: 'Error',
        description: 'An error occurred while saving the expense',
        variant: 'destructive',
      })
      console.error('Error saving expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingExpense) return

    const expenseToDelete = deletingExpense
    const originalExpenses = [...expenses]

    try {
      setSubmitting(true)
      
      // Optimistic update - remove from UI immediately
      setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id))
      
      // Close dialog immediately for better UX
      setIsDeleteDialogOpen(false)
      setDeletingExpense(null)

      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Expense deleted:', expenseToDelete.id)
        
        // Small delay to ensure DB write completes
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Fetch fresh data to ensure consistency
        await fetchExpenses()
        
        toast({
          title: 'Expense Deleted',
          description: 'The expense has been deleted successfully.',
        })
      } else {
        // Rollback on error
        setExpenses(originalExpenses)
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to delete expense',
          variant: 'destructive',
        })
      }
    } catch (error) {
      // Rollback on error
      setExpenses(originalExpenses)
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the expense',
        variant: 'destructive',
      })
      console.error('Error deleting expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      expense_date: expense.expense_date,
      frequency: expense.frequency,
      notes: expense.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingExpense(null)
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all business expenses</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-rose-50 to-red-100 border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-900">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{formatTZS(totalExpenses)}</div>
            <p className="text-xs text-rose-700 mt-1">{expenses.length} total entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {formatTZS(
                expenses
                  .filter((e) => {
                    const expDate = new Date(e.expense_date)
                    const now = new Date()
                    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
                  })
                  .reduce((sum, e) => sum + Number(e.amount), 0)
              )}
            </div>
            <p className="text-xs text-amber-700 mt-1">Current month expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {new Set(expenses.map((e) => e.category)).size}
            </div>
            <p className="text-xs text-blue-700 mt-1">Active expense categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{formatDate(expense.expense_date)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          <Tag className="h-3 w-3" />
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell className="capitalize">{expense.frequency}</TableCell>
                      <TableCell className="text-right font-semibold">{formatTZS(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingExpense(expense)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update the expense details below' : 'Enter the expense details below'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
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
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingExpense && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">{formatTZS(deletingExpense.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category:</span>
                <span>{deletingExpense.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description:</span>
                <span className="truncate ml-2">{deletingExpense.description}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingExpense(null)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
