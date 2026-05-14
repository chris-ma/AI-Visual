'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { createBrand, updateBrand, addCompetitor, deleteCompetitor } from '@/actions/brand'
import type { Brand, Competitor, WorkspaceWithRole } from '@/types'

interface Props {
  workspace: WorkspaceWithRole
  brand: Brand | null
  competitors: Competitor[]
}

export function SettingsClient({ workspace, brand: initialBrand, competitors: initialComps }: Props) {
  const [brand, setBrand] = useState(initialBrand)
  const [competitors, setCompetitors] = useState(initialComps)
  const [saving, setSaving] = useState(false)

  const [brandForm, setBrandForm] = useState({
    name: initialBrand?.name ?? '',
    category: initialBrand?.category ?? '',
    aliases: initialBrand?.aliases ?? [],
    domains: initialBrand?.domains ?? [],
    products: initialBrand?.products ?? [],
  })

  const [aliasInput, setAliasInput] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [compInput, setCompInput] = useState('')

  async function handleSaveBrand() {
    setSaving(true)
    try {
      if (brand) {
        const updated = await updateBrand(brand.id, brandForm)
        setBrand(updated)
      } else {
        const created = await createBrand({ workspaceId: workspace.id, ...brandForm })
        setBrand(created)
      }
      toast.success('Brand saved')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCompetitor() {
    if (!brand) { toast.error('Save your brand first'); return }
    if (!compInput.trim()) return
    try {
      const comp = await addCompetitor({ brandId: brand.id, name: compInput.trim(), domains: [] })
      setCompetitors((prev) => [...prev, comp])
      setCompInput('')
      toast.success('Competitor added')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add competitor')
    }
  }

  async function handleDeleteCompetitor(id: string) {
    try {
      await deleteCompetitor(id)
      setCompetitors((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete')
    }
  }

  function addToArray(key: 'aliases' | 'domains' | 'products', value: string) {
    if (!value.trim()) return
    setBrandForm((f) => ({ ...f, [key]: [...f[key], value.trim()] }))
  }

  function removeFromArray(key: 'aliases' | 'domains' | 'products', index: number) {
    setBrandForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{workspace.name}</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList>
          <TabsTrigger value="brand">Brand profile</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand details</CardTitle>
              <CardDescription>Used for accurate mention detection across AI engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Brand name *</Label>
                <Input value={brandForm.name} onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={brandForm.category} onChange={(e) => setBrandForm((f) => ({ ...f, category: e.target.value }))} placeholder="Project Management Software" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Alternate names / aliases</Label>
                <div className="flex gap-2">
                  <Input value={aliasInput} onChange={(e) => setAliasInput(e.target.value)} placeholder="e.g. ACME Inc" onKeyDown={(e) => { if (e.key === 'Enter') { addToArray('aliases', aliasInput); setAliasInput('') } }} />
                  <Button type="button" variant="outline" onClick={() => { addToArray('aliases', aliasInput); setAliasInput('') }}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brandForm.aliases.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                      {a} <button onClick={() => removeFromArray('aliases', i)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website domains</Label>
                <div className="flex gap-2">
                  <Input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder="acme.com" onKeyDown={(e) => { if (e.key === 'Enter') { addToArray('domains', domainInput); setDomainInput('') } }} />
                  <Button type="button" variant="outline" onClick={() => { addToArray('domains', domainInput); setDomainInput('') }}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brandForm.domains.map((d, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                      {d} <button onClick={() => removeFromArray('domains', i)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveBrand} loading={saving}>Save brand</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Competitors</CardTitle>
              <CardDescription>Track these brands alongside yours in AI answers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={compInput} onChange={(e) => setCompInput(e.target.value)} placeholder="Competitor name" onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()} />
                <Button onClick={handleAddCompetitor}><Plus className="h-4 w-4 mr-2" /> Add</Button>
              </div>
              <div className="space-y-2">
                {competitors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{c.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCompetitor(c.id)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                {competitors.length === 0 && <p className="text-sm text-muted-foreground">No competitors added yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
