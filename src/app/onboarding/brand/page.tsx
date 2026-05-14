'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrand, addCompetitor } from '@/actions/brand'
import { getUserWorkspaces } from '@/actions/workspace'

const schema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  category: z.string().optional(),
  aliases: z.array(z.object({ value: z.string() })),
  domains: z.array(z.object({ value: z.string() })),
  competitorNames: z.array(z.object({ value: z.string() })),
})
type FormData = z.infer<typeof schema>

export default function OnboardingBrandPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { aliases: [], domains: [], competitorNames: [{ value: '' }, { value: '' }] },
  })

  const { fields: aliasFields, append: addAlias, remove: removeAlias } = useFieldArray({ control, name: 'aliases' })
  const { fields: domainFields, append: addDomain, remove: removeDomain } = useFieldArray({ control, name: 'domains' })
  const { fields: compFields, append: addComp, remove: removeComp } = useFieldArray({ control, name: 'competitorNames' })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const workspaces = await getUserWorkspaces()
      const workspace = workspaces[0]
      if (!workspace) throw new Error('No workspace found')

      const brand = await createBrand({
        workspaceId: workspace.id,
        name: data.name,
        aliases: data.aliases.map((a) => a.value).filter(Boolean),
        domains: data.domains.map((d) => d.value).filter(Boolean),
        products: [],
        category: data.category || undefined,
      })

      const validComps = data.competitorNames.map((c) => c.value).filter(Boolean)
      for (const name of validComps) {
        await addCompetitor({ brandId: brand.id, name, domains: [] })
      }

      router.push('/onboarding/prompts')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save brand')
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
            <span className="font-medium text-primary">Step 2</span>
            <span>→</span>
            <span>Prompts</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Set up your brand</CardTitle>
            <CardDescription>Tell us about your brand so we can detect mentions accurately.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label>Brand name *</Label>
                <Input placeholder="Acme" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Project Management Software" {...register('category')} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Alternate names / aliases</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addAlias({ value: '' })}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {aliasFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2">
                    <Input placeholder="e.g. ACME Inc" {...register(`aliases.${i}.value`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAlias(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Website domains</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addDomain({ value: '' })}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {domainFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2">
                    <Input placeholder="acme.com" {...register(`domains.${i}.value`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDomain(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Competitors</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addComp({ value: '' })}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {compFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2">
                    <Input placeholder="Competitor name" {...register(`competitorNames.${i}.value`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeComp(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" loading={loading}>Continue →</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
