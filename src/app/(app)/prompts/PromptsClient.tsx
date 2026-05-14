'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Play, Trash2, MessageSquare, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/shared/EmptyState'
import { EngineIcon } from '@/components/shared/EngineIcon'
import { createPrompt, deletePrompt } from '@/actions/prompt'
import { runPrompt } from '@/actions/run'
import { formatRelativeTime } from '@/lib/utils'
import type { Prompt, WorkspaceWithRole, AIEngine } from '@/types'

const ALL_ENGINES: AIEngine[] = ['chatgpt', 'perplexity', 'gemini', 'claude', 'grok']

interface Props {
  workspace: WorkspaceWithRole
  initialPrompts: Prompt[]
}

export function PromptsClient({ workspace, initialPrompts }: Props) {
  const [prompts, setPrompts] = useState(initialPrompts)
  const [showCreate, setShowCreate] = useState(false)
  const [newText, setNewText] = useState('')
  const [newSchedule, setNewSchedule] = useState<'manual' | 'daily' | 'weekly'>('manual')
  const [creating, setCreating] = useState(false)
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [selectedEngines, setSelectedEngines] = useState<AIEngine[]>(['chatgpt'])
  const [runDialogPromptId, setRunDialogPromptId] = useState<string | null>(null)

  async function handleCreate() {
    if (newText.trim().length < 10) {
      toast.error('Prompt must be at least 10 characters')
      return
    }
    setCreating(true)
    try {
      const prompt = await createPrompt({ workspaceId: workspace.id, text: newText.trim(), tags: [], schedule: newSchedule, locale: 'en-US' })
      setPrompts((prev) => [prompt, ...prev])
      setNewText('')
      setShowCreate(false)
      toast.success('Prompt created')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create prompt')
    } finally {
      setCreating(false)
    }
  }

  async function handleRun(promptId: string) {
    if (selectedEngines.length === 0) {
      toast.error('Select at least one engine')
      return
    }
    setRunDialogPromptId(null)
    for (const engine of selectedEngines) {
      setRunningIds((prev) => new Set([...prev, promptId]))
      try {
        await runPrompt(promptId, engine)
        toast.success(`${engine} run complete`)
      } catch (err: any) {
        toast.error(`${engine} failed: ${err?.message ?? 'Unknown error'}`)
      } finally {
        setRunningIds((prev) => { const next = new Set(prev); next.delete(promptId); return next })
      }
    }
  }

  async function handleDelete(promptId: string) {
    try {
      await deletePrompt(promptId)
      setPrompts((prev) => prev.filter((p) => p.id !== promptId))
      toast.success('Prompt deleted')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete')
    }
  }

  function toggleEngine(engine: AIEngine) {
    setSelectedEngines((prev) => prev.includes(engine) ? prev.filter((e) => e !== engine) : [...prev, engine])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
          <p className="text-muted-foreground text-sm mt-1">Questions to run across AI engines</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New prompt
        </Button>
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No prompts yet"
          description="Add prompts — questions your customers ask AI tools — to start tracking your visibility."
          action={{ label: 'Add first prompt', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">{prompt.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{prompt.schedule}</Badge>
                      <Badge variant={prompt.status === 'active' ? 'secondary' : 'outline'} className="text-xs">{prompt.status}</Badge>
                      {prompt.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatRelativeTime(prompt.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRunDialogPromptId(prompt.id); setSelectedEngines(['chatgpt']) }}
                      disabled={runningIds.has(prompt.id)}
                      loading={runningIds.has(prompt.id)}
                    >
                      <Play className="h-3 w-3 mr-1" /> Run
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(prompt.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prompt text</Label>
              <Textarea
                placeholder="What are the best project management tools for startups?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select value={newSchedule} onValueChange={(v) => setNewSchedule(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!runDialogPromptId} onOpenChange={(o) => !o && setRunDialogPromptId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select AI engines</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose which engines to simulate this prompt against:</p>
            {ALL_ENGINES.map((engine) => (
              <div key={engine} className="flex items-center gap-3">
                <Checkbox
                  id={engine}
                  checked={selectedEngines.includes(engine)}
                  onCheckedChange={() => toggleEngine(engine)}
                />
                <label htmlFor={engine} className="flex items-center gap-2 cursor-pointer">
                  <EngineIcon engine={engine} />
                  <span className="text-sm capitalize">{engine}</span>
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogPromptId(null)}>Cancel</Button>
            <Button onClick={() => runDialogPromptId && handleRun(runDialogPromptId)}>
              <Play className="h-4 w-4 mr-2" /> Run {selectedEngines.length} engine{selectedEngines.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
