'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createPrompt } from '@/actions/prompt'
import { getUserWorkspaces } from '@/actions/workspace'

const STARTER_PROMPTS = [
  'What are the best tools for [your category]?',
  'What are the top alternatives to [competitor]?',
  'Which [category] software do experts recommend?',
]

export default function OnboardingPromptsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [prompts, setPrompts] = useState<string[]>(STARTER_PROMPTS)

  function updatePrompt(i: number, value: string) {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? value : p)))
  }

  function removePrompt(i: number) {
    setPrompts((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function onSubmit() {
    setLoading(true)
    try {
      const workspaces = await getUserWorkspaces()
      const workspace = workspaces[0]
      if (!workspace) throw new Error('No workspace found')

      const validPrompts = prompts.filter((p) => p.trim().length >= 10)
      if (validPrompts.length === 0) {
        toast.error('Add at least one prompt (min 10 characters)')
        return
      }

      for (const text of validPrompts) {
        await createPrompt({ workspaceId: workspace.id, text: text.trim(), tags: [], schedule: 'manual', locale: 'en-US' })
      }

      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save prompts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12">
      <div className="w-full max-w-lg px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Workspace</span>
            <span>→</span>
            <span>Brand</span>
            <span>→</span>
            <span className="font-medium text-primary">Step 3</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Add your first prompts</CardTitle>
            <CardDescription>
              These are questions users ask AI tools. Edit these or add your own — replace [brackets] with your actual brand/category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prompts.map((prompt, i) => (
              <div key={i} className="flex gap-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => updatePrompt(i, e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removePrompt(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPrompts((prev) => [...prev, ''])}
            >
              <Plus className="h-4 w-4 mr-2" /> Add prompt
            </Button>
            <Button className="w-full" onClick={onSubmit} loading={loading}>
              Go to dashboard →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
