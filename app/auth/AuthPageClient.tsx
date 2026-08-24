'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { api } from '@/lib/api'
import { Role, type UserResponse } from '@/types/user/user'
import { readResponseError } from '@/lib/http-error'
import {
  localeLabels,
  locales,
  useLocale,
  useTranslations,
  type Locale,
  type TranslationCatalog,
} from '@/lib/i18n'

const authCatalog: TranslationCatalog = {
  en: {
    createAccount: 'Create Account',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    debater: 'Debater',
    organizer: 'Organizer',
    city: 'City',
    institution: 'Institution',
    signUp: 'Sign Up',
    signingUp: 'Signing up...',
    signInToDeBetter: 'Sign in to DeBetter',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot your password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    welcomeBack: 'Welcome Back!',
    loginInvitation: 'To keep connected with us please login with your personal info',
    helloFriend: 'Hello, Friend!',
    registrationInvitation: 'Enter your personal details and start your journey with us',
    usernameValidation: 'Username must be 3–20 characters, letters and numbers only',
    invalidEmail: 'Invalid email format',
    passwordValidation: 'Password must be at least 8 characters',
    registrationFailed: 'Registration failed. Please try again.',
    checkDetails: 'Please check your details and try again.',
    usernameOrEmailTaken: 'That username or email is already taken.',
    serverError: 'Server error — please try again later.',
    accountCreated: 'Account created successfully! Redirecting...',
    networkError: 'Network error — please check your connection and try again.',
    invalidUsername: 'Invalid username format',
    passwordRequired: 'Password is required',
    loginFailed: 'Login failed. Please try again.',
    invalidCredentials: 'Invalid username or password.',
    language: 'Language',
  },
  ru: {
    createAccount: 'Создать аккаунт',
    username: 'Имя пользователя',
    email: 'Электронная почта',
    password: 'Пароль',
    firstName: 'Имя',
    lastName: 'Фамилия',
    debater: 'Дебатёр',
    organizer: 'Организатор',
    city: 'Город',
    institution: 'Учебное заведение',
    signUp: 'Зарегистрироваться',
    signingUp: 'Регистрация...',
    signInToDeBetter: 'Войти в DeBetter',
    rememberMe: 'Запомнить меня',
    forgotPassword: 'Забыли пароль?',
    signIn: 'Войти',
    signingIn: 'Вход...',
    welcomeBack: 'С возвращением!',
    loginInvitation: 'Чтобы оставаться с нами на связи, войдите, используя свои данные',
    helloFriend: 'Привет, друг!',
    registrationInvitation: 'Введите свои данные и начните свой путь вместе с нами',
    usernameValidation: 'Имя пользователя должно содержать от 3 до 20 букв и цифр',
    invalidEmail: 'Неверный формат электронной почты',
    passwordValidation: 'Пароль должен содержать не менее 8 символов',
    registrationFailed: 'Не удалось зарегистрироваться. Попробуйте ещё раз.',
    checkDetails: 'Проверьте введённые данные и попробуйте ещё раз.',
    usernameOrEmailTaken: 'Это имя пользователя или электронная почта уже заняты.',
    serverError: 'Ошибка сервера — попробуйте ещё раз позже.',
    accountCreated: 'Аккаунт успешно создан! Выполняется перенаправление...',
    networkError: 'Ошибка сети — проверьте подключение и попробуйте ещё раз.',
    invalidUsername: 'Неверный формат имени пользователя',
    passwordRequired: 'Введите пароль',
    loginFailed: 'Не удалось войти. Попробуйте ещё раз.',
    invalidCredentials: 'Неверное имя пользователя или пароль.',
    language: 'Язык',
  },
  kk: {
    createAccount: 'Аккаунт жасау',
    username: 'Пайдаланушы аты',
    email: 'Электрондық пошта',
    password: 'Құпиясөз',
    firstName: 'Аты',
    lastName: 'Тегі',
    debater: 'Дебатшы',
    organizer: 'Ұйымдастырушы',
    city: 'Қала',
    institution: 'Оқу орны',
    signUp: 'Тіркелу',
    signingUp: 'Тіркелу орындалуда...',
    signInToDeBetter: 'DeBetter жүйесіне кіру',
    rememberMe: 'Мені есте сақтау',
    forgotPassword: 'Құпиясөзді ұмыттыңыз ба?',
    signIn: 'Кіру',
    signingIn: 'Кіру орындалуда...',
    welcomeBack: 'Қайта қош келдіңіз!',
    loginInvitation: 'Бізбен байланыста болу үшін жеке деректеріңізбен кіріңіз',
    helloFriend: 'Сәлем, досым!',
    registrationInvitation: 'Жеке деректеріңізді енгізіп, бізбен бірге саяхатыңызды бастаңыз',
    usernameValidation: 'Пайдаланушы аты 3–20 әріп пен саннан тұруы керек',
    invalidEmail: 'Электрондық пошта пішімі қате',
    passwordValidation: 'Құпиясөз кемінде 8 таңбадан тұруы керек',
    registrationFailed: 'Тіркелу сәтсіз аяқталды. Қайталап көріңіз.',
    checkDetails: 'Деректеріңізді тексеріп, қайталап көріңіз.',
    usernameOrEmailTaken: 'Бұл пайдаланушы аты немесе электрондық пошта бос емес.',
    serverError: 'Сервер қатесі — кейінірек қайталап көріңіз.',
    accountCreated: 'Аккаунт сәтті жасалды! Бағыттау орындалуда...',
    networkError: 'Желі қатесі — байланысыңызды тексеріп, қайталап көріңіз.',
    invalidUsername: 'Пайдаланушы атының пішімі қате',
    passwordRequired: 'Құпиясөзді енгізіңіз',
    loginFailed: 'Кіру сәтсіз аяқталды. Қайталап көріңіз.',
    invalidCredentials: 'Пайдаланушы аты немесе құпиясөз қате.',
    language: 'Тіл',
  },
}

// Backend rule (mirrors UserRegistrationDto validation): alphanumeric, 3–20 chars.
const USERNAME_PATTERN = /^[a-zA-Z0-9]{3,20}$/
const CURRENT_USER_KEY = ['current-user'] as const

function isUserResponse(value: unknown): value is UserResponse {
  if (!value || typeof value !== 'object') return false

  const user = value as Partial<UserResponse>
  return typeof user.id === 'number' && typeof user.username === 'string'
}

async function readUserResponse(response: Response): Promise<UserResponse | null> {
  try {
    const data = await response.json()
    return isUserResponse(data) ? data : null
  } catch {
    return null
  }
}

async function readAuthenticatedUser(response: Response): Promise<UserResponse | null> {
  const authUser = await readUserResponse(response)
  if (authUser) return authUser

  const currentUserResponse = await api.getMe()
  if (!currentUserResponse.ok) return null

  return readUserResponse(currentUserResponse)
}

export type AuthMode = 'login' | 'register'

export type AuthPageClientProps = {
  initialMode: AuthMode
  requestedMode: AuthMode | null
}

export default function AuthPageClient({ initialMode, requestedMode }: AuthPageClientProps) {
  const router = useRouter()
  const { locale, setLocale } = useLocale()
  const t = useTranslations(authCatalog)
  const [isSignUp, setIsSignUp] = useState(() => initialMode !== 'login')
  const [isClientReady, setIsClientReady] = useState(false)
  const { mutate } = useSWRConfig()
  // Sign Up state and validation
  const [signUpUsername, setSignUpUsername] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [role, setRole] = useState<Role>(Role.PARTICIPANT)

  const [signUpFirstName, setSignUpFirstName] = useState('')
  const [signUpLastName, setSignUpLastName] = useState('')
  const [signUpCity, setSignUpCity] = useState('')
  const [signUpInstitution, setSignUpInstitution] = useState('')

  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  // Sign In state and validation
  const [signInUsername, setSignInUsername] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  // Loading and error states
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpErrorMsg, setSignUpErrorMsg] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)

  useEffect(() => {
    setIsClientReady(true)
  }, [])

  useEffect(() => {
    if (requestedMode === 'login') {
      setIsSignUp(false)
    } else if (requestedMode === 'register') {
      setIsSignUp(true)
    }
  }, [requestedMode])

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: { name?: string; email?: string; password?: string } = {}
    if (!USERNAME_PATTERN.test(signUpUsername)) errors.name = t('usernameValidation')
    if (!/^\S+@\S+\.\S+$/.test(signUpEmail)) errors.email = t('invalidEmail')
    if (signUpPassword.length < 8) errors.password = t('passwordValidation')
    setSignUpErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSignUpErrorMsg(null)
    setSignUpSuccess(null)
    setSignUpLoading(true)
    try {
      const res = await api.register({
        username: signUpUsername,
        password: signUpPassword,
        email: signUpEmail,
        firstName: signUpFirstName,
        lastName: signUpLastName,
        role: role,
        ...(role === Role.PARTICIPANT && {
          city: { name: signUpCity },
          institution: { name: signUpInstitution },
        }),
      });
      if (!res.ok) {
        setSignUpErrorMsg(await readResponseError(res, {
          fallback: t('registrationFailed'),
          unauthorized: t('checkDetails'),
          badRequest: t('checkDetails'),
          conflict: t('usernameOrEmailTaken'),
          serverError: t('serverError'),
        }))
      } else {
        const user = await readAuthenticatedUser(res)
        setSignUpSuccess(t('accountCreated'))
        if (user) {
          await mutate(CURRENT_USER_KEY, user, { revalidate: false })
        } else {
          await mutate(CURRENT_USER_KEY)
        }
        setTimeout(() => {
          if (role === Role.ORGANIZER) router.push('/organizer')
          else router.push('/dashboard')
        }, 2000)
        return                      // prevent setState in finally
      }
    } catch {
      setSignUpErrorMsg(t('networkError'))
    } finally { setSignUpLoading(false) }
  }

  const handleSignInSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors: string[] = []
    if (!/^[a-zA-Z0-9]{3,20}$/.test(signInUsername)) validationErrors.push(t('invalidUsername'))
    if (!signInPassword) validationErrors.push(t('passwordRequired'))
    if (validationErrors.length) return setSignInError(validationErrors.join(', '))
    setSignInError(null)
    setSignInLoading(true)
    try {
      const res = await api.login({
        username: signInUsername,
        password: signInPassword,
        rememberMe: rememberMe
      });
      if (!res.ok) {
        setSignInError(await readResponseError(res, {
          fallback: t('loginFailed'),
          unauthorized: t('invalidCredentials'),
          serverError: t('serverError'),
        }))
      }
      else {
        const user = await readAuthenticatedUser(res)
        if (user) {
          await mutate(CURRENT_USER_KEY, user, { revalidate: false })
        } else {
          await mutate(CURRENT_USER_KEY)
        }
        router.push('/dashboard')
        return
      }
    } catch {
      setSignInError(t('networkError'))
    } finally { setSignInLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] font-hikasami">
      <div className="brand-logo absolute top-4 left-6 text-2xl font-bold text-[#0D1321] z-50">
        DeBetter
      </div>

      <div className="absolute top-4 right-6 z-[200]">
        <label htmlFor="auth-language-selector" className="sr-only">{t('language')}</label>
        <select
          id="auth-language-selector"
          aria-label={t('language')}
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          className="appearance-none rounded-md border border-[#3E5C76] bg-white px-2 py-1.5 pr-7 text-sm text-[#0D1321] shadow-sm transition-colors hover:border-[#748CAB] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] focus:ring-opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 0.35rem center', backgroundSize: '1rem' }}
        >
          {locales.map((optionLocale) => (
            <option key={optionLocale} value={optionLocale}>
              {localeLabels[optionLocale]}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`container relative overflow-hidden bg-white rounded-xl shadow-2xl w-[980px] max-w-full min-h-[640px] ${isSignUp ? 'right-panel-active' : ''}`}
        data-auth-mode={isSignUp ? 'register' : 'login'}
        data-auth-client-ready={isClientReady ? 'true' : 'false'}
      >

        {/* Sign Up Form */}
        <div className={`form-container sign-up-container absolute top-0 h-full w-1/2 left-0 transition-all duration-500 ease-in-out ${
          isSignUp ? 'translate-x-full opacity-100 z-10' : 'opacity-0 z-0'
        }`}>
          <form onSubmit={handleSignUpSubmit} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h2 className="text-3xl font-bold mb-6 text-[#2D3748]">{t('createAccount')}</h2>

            <label htmlFor="auth-signup-name" className="sr-only">{t('username')}</label>
            <input
              id="auth-signup-name"
              name="username"
              type="text"
              placeholder={t('username')}
              required
              maxLength={20}
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            {signUpErrors.name && <p className="text-red-500 text-xs">{signUpErrors.name}</p>}
            <label htmlFor="auth-signup-email" className="sr-only">{t('email')}</label>
            <input
              id="auth-signup-email"
              name="email"
              type="email"
              placeholder={t('email')}
              required
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            {signUpErrors.email && <p className="text-red-500 text-xs">{signUpErrors.email}</p>}
            <label htmlFor="auth-signup-password" className="sr-only">{t('password')}</label>
            <input
              id="auth-signup-password"
              name="password"
              type="password"
              placeholder={t('password')}
              required
              minLength={8}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            {signUpErrors.password && <p className="text-red-500 text-xs">{signUpErrors.password}</p>}

            <label htmlFor="auth-signup-firstname" className="sr-only">{t('firstName')}</label>
            <input
              id="auth-signup-firstname"
              type="text"
              placeholder={t('firstName')}
              required
              value={signUpFirstName}
              onChange={(e) => setSignUpFirstName(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />

            <label htmlFor="auth-signup-lastname" className="sr-only">{t('lastName')}</label>
            <input
              id="auth-signup-lastname"
              type="text"
              placeholder={t('lastName')}
              required
              value={signUpLastName}
              onChange={(e) => setSignUpLastName(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />

            <div className="w-full mt-4 mb-2">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center">
                  <input
                    id="debater-radio"
                    type="radio"
                    name="role"
                    value="debater"
                    checked={role === Role.PARTICIPANT}
                    onChange={() => setRole(Role.PARTICIPANT)}
                    className="mr-2 w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 focus:ring-[#3E5C76] focus:ring-2"
                  />
                  <label htmlFor="debater-radio" className="text-sm text-gray-700 font-hikasami">
                    {t('debater')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="organizer-radio"
                    type="radio"
                    name="role"
                    value="organizer"
                    checked={role === Role.ORGANIZER}
                    onChange={() => setRole(Role.ORGANIZER)}
                    className="mr-2 w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 focus:ring-[#3E5C76] focus:ring-2"
                  />
                  <label htmlFor="organizer-radio" className="text-sm text-gray-700 font-hikasami">
                    {t('organizer')}
                  </label>
                </div>
              </div>
            </div>

            {role === Role.PARTICIPANT && (
              <>
                <label htmlFor="auth-signup-city" className="sr-only">{t('city')}</label>
                <input
                  id="auth-signup-city"
                  type="text"
                  placeholder={t('city')}
                  required={role === Role.PARTICIPANT}
                  value={signUpCity}
                  onChange={(e) => setSignUpCity(e.target.value)}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                />

                <label htmlFor="auth-signup-institution" className="sr-only">{t('institution')}</label>
                <input
                  id="auth-signup-institution"
                  type="text"
                  placeholder={t('institution')}
                  required={role === Role.PARTICIPANT}
                  value={signUpInstitution}
                  onChange={(e) => setSignUpInstitution(e.target.value)}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                />
              </>
            )}

            {signUpErrorMsg && <p className="text-red-500 text-xs">{signUpErrorMsg}</p>}
            {signUpSuccess && <p className="text-green-500 text-xs">{signUpSuccess}</p>}

            <button type="submit" disabled={signUpLoading} className="rounded-full border border-[#3E5C76] bg-[#3E5C76] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95 hover:bg-[#2D3748] mt-4 disabled:opacity-50">
              {signUpLoading ? t('signingUp') : t('signUp')}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`form-container sign-in-container absolute top-0 h-full w-1/2 left-0 transition-all duration-500 ease-in-out ${
          isSignUp ? 'translate-x-full z-0' : 'z-20'
        }`}>
          <form onSubmit={handleSignInSubmit} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h2 className="text-3xl font-bold mb-6 text-[#2D3748]">{t('signInToDeBetter')}</h2>

            <label htmlFor="auth-signin-email" className="sr-only">{t('username')}</label>
            <input
              id="auth-signin-email"
              name="username"
              type="text"
              placeholder={t('username')}
              value={signInUsername}
              onChange={(e) => setSignInUsername(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            <label htmlFor="auth-signin-password" className="sr-only">{t('password')}</label>
            <input
              id="auth-signin-password"
              name="password"
              type="password"
              placeholder={t('password')}
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              className="bg-gray-200 border-none p-3 my-2 w-full rounded-md focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
            />
            <div className="flex items-center w-full justify-start my-3 px-1">
                <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2"
                />
                <label htmlFor="remember-me-checkbox" className="ml-2 text-sm font-medium text-gray-700">
                    {t('rememberMe')}
                </label>
            </div>
            {signInError && <p className="text-red-500 text-xs">{signInError}</p>}

            <a href="#" className="text-gray-700 text-sm no-underline my-4 hover:underline">{t('forgotPassword')}</a>

            <button type="submit" disabled={signInLoading} className="rounded-full border border-[#3E5C76] bg-[#3E5C76] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95 hover:bg-[#2D3748] disabled:opacity-50">
              {signInLoading ? t('signingIn') : t('signIn')}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className={`overlay-container absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-500 ease-in-out z-[100] ${
          isSignUp ? '-translate-x-full' : ''
        }`}>
          <div className={`overlay bg-[#3E5C76] bg-no-repeat bg-cover bg-center text-white relative -left-full h-full w-[200%] transition-transform duration-500 ease-in-out ${
            isSignUp ? 'translate-x-1/2' : 'translate-x-0'
          }`} style={{
            backgroundImage: 'url(/images/log_reg.png)'
          }}>

            {/* Left Panel */}
            <div className={`overlay-panel overlay-left absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 transition-transform duration-500 ease-in-out ${
              isSignUp ? 'translate-x-0' : '-translate-x-[20%]'
            }`}>
              <h1 className="font-bold text-4xl mb-4">{t('welcomeBack')}</h1>
              <p className="text-sm mb-6 leading-relaxed">{t('loginInvitation')}</p>
              <button
                onClick={() => setIsSignUp(false)}
                className="rounded-full border-2 border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-all hover:bg-white hover:bg-opacity-10"
              >
                {t('signIn')}
              </button>
            </div>

            {/* Right Panel */}
            <div className={`overlay-panel overlay-right absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-500 ease-in-out ${
              isSignUp ? 'translate-x-[20%]' : 'translate-x-0'
            }`}>
              <h1 className="font-bold text-4xl mb-4">{t('helloFriend')}</h1>
              <p className="text-sm mb-6 leading-relaxed">{t('registrationInvitation')}</p>
              <button
                onClick={() => setIsSignUp(true)}
                className="rounded-full border-2 border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-all hover:bg-white hover:bg-opacity-10"
              >
                {t('signUp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
