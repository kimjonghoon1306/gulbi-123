'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import RegisterView from './_RegisterView'
import { useRouter } from 'next/navigation'

export default function SupplierRegisterPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [form, setForm] = useState({
    email: '', password: '', company_name: '', representative: '',
    business_number: '', contact: '', address: '', category: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [agree, setAgree] = useState(false)

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.company_name) return setError('이메일, 비밀번호, 업체명은 필수입니다.')
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (!agree) return setError('이용약관·개인정보 수집·이용에 동의해주세요.')
    setLoading(true); setError('')
    const supabase = createClient()

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { account_type: 'supplier' } },
    })
    if (authErr) {
      setLoading(false)
      const msg = authErr.message
      if (msg.includes('invalid email') || msg.includes('Invalid email')) return setError('이메일 형식이 올바르지 않습니다.')
      return setError('가입 오류: ' + msg)
    }
    if (!authData.user) { setLoading(false); return setError('가입에 실패했습니다.') }

    let userId = ''
    const isExisting = authData.user.identities && authData.user.identities.length === 0
    if (isExisting) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (signInErr || !signInData?.user) { setLoading(false); return setError('이미 가입된 이메일입니다. 비밀번호를 정확히 입력해주세요.') }
      userId = signInData.user.id
    } else {
      userId = authData.user.id
    }

    const { data: existing } = await supabase.from('suppliers').select('id').eq('id', userId).single()
    if (existing) { await supabase.auth.signOut(); setLoading(false); return setError('이미 공급업체로 가입된 계정입니다.') }

    const { error: dbErr } = await supabase.from('suppliers').insert({
      id: userId, email: form.email, company_name: form.company_name,
      representative: form.representative, business_number: form.business_number,
      contact: form.contact, address: form.address, category: form.category, status: '대기중',
    })
    await supabase.auth.signOut()
    setLoading(false)
    if (dbErr) return setError('정보 저장 실패: ' + dbErr.message)
    setDone(true)
  }

  return (
    <RegisterView
      dark={dark}
      setDark={setDark}
      form={form}
      setForm={setForm}
      loading={loading}
      error={error}
      done={done}
      agree={agree}
      setAgree={setAgree}
      handleSubmit={handleSubmit}
    />
  )
}
