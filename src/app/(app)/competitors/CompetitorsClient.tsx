'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { addCompetitor, deleteCompetitor } from '@/actions/brand'
import type { Brand, Competitor } from '@/types'

interface MentionCount {
  entityId: string
  entityType: string
  mentioned: number
  recommended: number
  compared: number
}

interface Props {
  brand: Brand | null
  competitors: Competitor[]
  mentionCounts: MentionCount[]
  workspaceId: string
}

export function CompetitorsClient({ brand, competitors: initialComps, mentionCounts, workspaceId }: Props) {
  const [competitors, setCompetitors] = useState(initialComps)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  function getMentionData() {
    if (!brand) return []
    const allEntities = [
      { id: brand.id, name: brand.name, isBrand: true },
      ...competitors.map((c) => ({ id: c.id, name: c.name, isBrand: false })),
    ]
    return allEntities.map((e) => {
      const counts = mentionCounts.find((m) => m.entityId === e.id) ?? { mentioned: 0, recommended: 0, compared: 0 }
      return { name: e.name, mentioned: counts.mentioned, recommended: counts.recommended, compared: counts.compared }
    })
  }

  async function handleAdd() {
    if (!brand) return
    if (!newName.trim()) { toast.error('Enter a competitor name'); return }
    setAdding(true)
    try {
      const comp = await addCompetitor({ brandId: brand.id, name: newName.trim(), domains: [] })
      setCompetitors((prev) => [...prev, comp])
      setNewName('')
      setShowAdd(false)
      toast.success('Competitor added')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add competitor')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCompetitor(id)
      setCompetitors((prev) => prev.filter((c) => c.id !== id))
      toast.success('Competitor removed')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to remove')
    }
  }

  if (!brand) {
    return <EmptyState icon={Users} title="Set up your brand first" description="Add your brand profile before tracking competitors." action={{ label: 'Set up brand', onClick: () => window.location.href = '/settings/brand' }} />
  }

  const chartData = getMentionData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitors</h1>
          <p className="text-muted-foreground text-sm mt-1">Share of mentions vs {brand.name}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add competitor</Button>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mention share (last 30 days)</CardTitle>
            <CardDescription>How often each brand appears across all prompt runs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="recommended" fill="#2563eb" name="Recommended" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="mentioned" fill="#93c5fd" name="Mentioned" stackId="a" />
                <Bar dataKey="compared" fill="#dbeafe" name="Compared" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tracked competitors</CardTitle>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No competitors added yet.</p>
          ) : (
            <div className="space-y-2">
              {competitors.map((comp) => {
                const counts = mentionCounts.find((m) => m.entityId === comp.id)
                const total = (counts?.mentioned ?? 0) + (counts?.recommended ?? 0) + (counts?.compared ?? 0)
                return (
                  <div key={comp.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{comp.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{total} mentions</span>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(comp.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add competitor</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Competitor name</Label>
            <Input placeholder="e.g. Notion, Linear, Jira" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={adding}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
