import React, { useEffect, useState } from "react"
import SoftBackDrop from "./SoftBackDrop"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Loader2Icon } from "lucide-react"


const Login = () => {

    const [state, setState] = useState<"login" | "register">("login")
    const [submitting, setSubmitting] = useState(false)
    const { user, login, signUp } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    // Return to the page that required login, if any
    const redirectTo = (location.state as { from?: string } | null)?.from || "/generate"

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        if (state === 'login') {
            await login({ email: formData.email, password: formData.password })
        } else {
            await signUp(formData)
        }
        setSubmitting(false)
    }

    useEffect(() => {
        if (user) {
            navigate(redirectTo, { replace: true })
        }
    }, [user])

    const inputWrapper = "flex items-center w-full mt-4 bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all"
    const inputClass = "w-full bg-transparent text-white placeholder-white/60 border-none outline-none"

    return (
        <>
            <SoftBackDrop />
            <div className='min-h-screen flex items-center justify-center px-4' >

                <form
                    onSubmit={handleSubmit}
                    className="w-full sm:w-87.5 text-center bg-white/6 border border-white/10 rounded-2xl px-8">
                    <h1 className="text-white text-3xl mt-10 font-medium">
                        {state === "login" ? "Login" : "Sign up"}
                    </h1>

                    <p className="text-gray-400 text-sm mt-2">
                        {state === "login" ? "Please sign in to continue" : "Create an account to get free credits"}
                    </p>

                    {state !== "login" && (
                        <div className={inputWrapper}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="8" r="5" /> <path d="M20 21a8 8 0 0 0-16 0" /> </svg>
                            <input type="text" name="name" placeholder="Name" autoComplete="name" minLength={2} maxLength={60}
                                className={inputClass} value={formData.name} onChange={handleChange} required />
                        </div>
                    )}

                    <div className={inputWrapper}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /> <rect x="2" y="4" width="20" height="16" rx="2" /> </svg>
                        <input type="email" name="email" placeholder="Email" autoComplete="email"
                            className={inputClass} value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className={inputWrapper}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" /> </svg>
                        <input type="password" name="password" placeholder="Password"
                            autoComplete={state === "login" ? "current-password" : "new-password"}
                            minLength={state === "login" ? undefined : 8}
                            className={inputClass} value={formData.password} onChange={handleChange} required />
                    </div>

                    {state !== "login" && (
                        <p className="mt-2 text-left text-xs text-zinc-400 pl-2">
                            At least 8 characters, with a letter and a number.
                        </p>
                    )}

                    <button type="submit" disabled={submitting}
                        className="mt-6 w-full h-11 rounded-full text-white bg-pink-600 hover:bg-pink-500 transition
                        disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {submitting && <Loader2Icon className="size-4 animate-spin" />}
                        {state === "login" ? "Login" : "Sign up"}
                    </button>

                    <p className="text-gray-400 text-sm mt-3 mb-11">
                        {state === "login" ? "Don't have an account?" : "Already have an account?"}
                        <button type="button" onClick={() => setState(prev => prev === "login" ? "register" : "login")}
                            className="text-pink-400 hover:underline ml-1">
                            {state === "login" ? "Sign up" : "Log in"}
                        </button>
                    </p>
                </form>
            </div>
        </>
    )
}

export default Login
