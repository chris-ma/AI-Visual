'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signUpUser } from '@/actions/workspace'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(data: SignupForm) {
    setLoading(true)
    try {
      await signUpUser(data)
      const result = await signIn('credentials', { email: data.email, password: data.password, redirect: false })
      if (result?.error) {
        toast.error('Account created but sign-in failed. Try logging in.')
        router.push('/login')
      } else {
        router.push('/onboarding/workspace')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg" style={{ borderColor: '#c5d8ee', background: '#ffffff' }}>
      <CardHeader>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#4a6fa5' }}>
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: '#6b8ab8' }}>AI Visibility</span>
        </div>
        <CardTitle className="text-2xl" style={{ color: '#1a2b4a' }}>Create an account</CardTitle>
        <CardDescription style={{ color: '#6b8ab8' }}>Start tracking your AI visibility in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Smith" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>Create account</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
