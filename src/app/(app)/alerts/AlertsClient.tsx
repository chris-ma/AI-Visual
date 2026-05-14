'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Bell, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { createAlert, toggleAlert, deleteAlert } from '@/actions/alert'
import type { Alert, WorkspaceWithRole } from '@/types'

const ALERT_LABELS: Record<string, string> = {
  visibility_drop: 'Visibility drop',
  competitor_overtake: 'Competitor overtake',
  mention_spike: 'Mention spike',
  citation_lost: 'Citation lost',
}

interface Props {
  workspace: WorkspaceWithRole
  initialAlerts: Alert[]
}

export function AlertsClient({ workspace, initialAlerts }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ type: 'visibility_drop', threshold: 10, channel: 'email' })

  async function handleCreate() {
    setCreating(true)
    try {
      const alert = await createAlert({ workspaceId: workspace.id, type: form.type as any, threshold: form.threshold, channel: form.channel as any, config: {} })
      setAlerts((prev) => [...prev, alert])
      setShowCreate(false)
      toast.success('Alert created')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create alert')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(id: string) {
    try {
      const updated = await toggleAlert(id)
      setAlerts((prev) => prev.map((a) => a.id === id ? updated : a))
    } catch (err: any) {
      toast.error(err?.message)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      toast.success('Alert deleted')
    } catch (err: any) {
      toast.error(err?.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">Get notified when visibility changes</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New alert</Button>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts configured"
          description="Set up alerts to be notified when your AI visibility changes significantly."
          action={{ label: 'Create alert', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Switch checked={alert.isActive} onCheckedChange={() => handleToggle(alert.id)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ALERT_LABELS[alert.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      Threshold: {alert.threshold}% · Channel: {alert.channel}
                    </p>
                  </div>
                  <Badge variant={alert.isActive ? 'default' : 'secondary'} className="text-xs">
                    {alert.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(alert.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New alert</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alert type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visibility_drop">Visibility drop</SelectItem>
                  <SelectItem value="competitor_overtake">Competitor overtake</SelectItem>
                  <SelectItem value="mention_spike">Mention spike</SelectItem>
                  <SelectItem value="citation_lost">Citation lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Threshold (%)</Label>
              <Input type="number" min={1} max={100} value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
