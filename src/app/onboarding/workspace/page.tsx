'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createWorkspace } from '@/actions/workspace'
import { createWorkspaceSchema, type CreateWorkspaceInput } from '@/lib/validations/workspace'

export default function OnboardingWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
  })

  async function onSubmit(data: CreateWorkspaceInput) {
    setLoading(true)
    try {
      await createWorkspace(data)
      router.push('/onboarding/brand')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-lg">AI</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-medium text-primary">Step 1</span>
            <span>→</span>
            <span>Brand</span>
            <span>→</span>
            <span>Prompts</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your workspace</CardTitle>
            <CardDescription>Give your workspace a name. This is usually your company or client name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace name</Label>
                <Input id="name" placeholder="Acme Corp" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <Button type="submit" className="w-full" loading={loading}>Continue →</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
