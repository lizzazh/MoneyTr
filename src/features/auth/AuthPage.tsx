import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/shared/auth-context'
import { Input } from '@/shared/ui/FormFields'
import { Scale, Lock, User, Eye, EyeOff, Key } from 'lucide-react'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  login: z
    .string()
    .min(3, 'Мінімум 3 символи')
    .regex(/^[a-zA-Z0-9_]+$/, 'Тільки латинські літери, цифри та підкреслення'),
  password: z.string().min(6, 'Мінімум 6 символів'),
})

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Мінімум 2 символи'),
    login: z
      .string()
      .min(3, 'Мінімум 3 символи')
      .regex(/^[a-zA-Z0-9_]+$/, 'Тільки латинські літери, цифри та підкреслення'),
    password: z.string().min(6, 'Мінімум 6 символів'),
    confirmPassword: z.string().min(6, 'Мінімум 6 символів'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  })

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await signIn(data.login, data.password)
      toast.success('Ласкаво просимо!')
    } catch {
      toast.error('Невірний логін або пароль')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative">
        <Input
          label="Логін"
          type="text"
          placeholder="your_login"
          error={errors.login?.message}
          {...register('login')}
        />
        <User
          size={16}
          className="absolute right-3 top-9 text-warm-gray pointer-events-none"
        />
      </div>

      <div className="relative">
        <Input
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-3 top-9 text-warm-gray hover:text-chocolate transition-colors"
          aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full mt-2"
      >
        <Lock size={16} />
        {isLoading ? 'Вхід...' : 'Увійти'}
      </button>
    </form>
  )
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm() {
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await signUp(data.login, data.password, data.displayName)
      toast.success('Акаунт створено!')
    } catch (err) {
      console.error('Registration error:', err)
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('login-already-in-use')) {
        toast.error('Цей логін вже зайнятий іншим користувачем')
      } else if (msg.includes('invalid-login-format')) {
        toast.error('Недійсний формат логіну')
      } else {
        toast.error('Помилка реєстрації. Спробуйте ще раз.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative">
        <Input
          label="Ім'я"
          type="text"
          placeholder="Ваше ім'я"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <User
          size={16}
          className="absolute right-3 top-9 text-warm-gray pointer-events-none"
        />
      </div>

      <div className="relative">
        <Input
          label="Логін"
          type="text"
          placeholder="Тільки англійські літери, цифри та _"
          error={errors.login?.message}
          {...register('login')}
        />
        <User
          size={16}
          className="absolute right-3 top-9 text-warm-gray pointer-events-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-9 text-warm-gray hover:text-chocolate transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Повтор пароля"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Key
            size={16}
            className="absolute right-3 top-9 text-warm-gray pointer-events-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full mt-2"
      >
        <User size={16} />
        {isLoading ? 'Реєстрація...' : 'Створити акаунт'}
      </button>
    </form>
  )
}

// ─── Auth Page ────────────────────────────────────────────────────────────────

type Tab = 'login' | 'register'

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-milk p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-chocolate mb-4 shadow-card-lg">
            <Scale size={28} className="text-milk" />
          </div>
          <h1 className="text-2xl font-bold text-chocolate">DebtTrack</h1>
          <p className="text-sm text-warm-gray mt-1">
            Взаємний облік фінансових операцій між двома людьми
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-card-lg">
          {/* Tabs */}
          <div className="flex gap-1 bg-cream rounded-xl p-1 mb-6">
            {(
              [
                { id: 'login', label: 'Вхід' },
                { id: 'register', label: 'Реєстрація' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-beige text-chocolate shadow-sm'
                    : 'text-warm-gray hover:text-chocolate'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  )
}
