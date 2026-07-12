'use client'

import { useState, useEffect } from 'react'
import SettingsView from './_SettingsView'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type KeyInfo = { hasKey: boolean; keyHint: string | null; geminiKeyHint?: string | null; isValid: boolean; updatedAt: string | null }

function SettingsContent() {
  const t = useSupplierTheme()
  const supabase = createClient()
  const router = useRouter()

  const [keyInfo, setKeyInfo]       = useState<KeyInfo | null>(null)
  const [keyInput, setKeyInput]     = useState('')
  const [showKey, setShowKey]       = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyMsg, setKeyMsg]         = useState<{type:'success'|'error';text:string}|null>(null)

  const [geminiInput, setGeminiInput]     = useState('')
  const [showGemini, setShowGemini]       = useState(false)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiMsg, setGeminiMsg]         = useState<{type:'success'|'error';text:string}|null>(null)

  const [curPw, setCurPw]         = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCur, setShowCur]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [showCfm, setShowCfm]     = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg]         = useState<{type:'success'|'error';text:string}|null>(null)

  useEffect(() => { fetchKeyInfo() }, [])

  const fetchKeyInfo = async () => {
    try {
      const res = await fetch('/api/user-key')
      if (res.ok) setKeyInfo(await res.json())
    } catch {}
  }

  const saveKey = async () => {
    if (!keyInput.trim()) return setKeyMsg({ type: 'error', text: 'API 키를 입력해주세요.' })
    setKeyLoading(true); setKeyMsg(null)
    try {
      const res = await fetch('/api/user-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiKey: keyInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[supplier settings] openai key save failed', data)
        setKeyMsg({ type: 'error', text: 'API 키 저장에 실패했습니다. 입력한 키를 확인해 주세요.' })
      } else {
        setKeyMsg({ type: 'success', text: '✅ API 키가 저장됐어요!' })
        setKeyInput('')
        fetchKeyInfo()
        setTimeout(() => setKeyMsg(null), 3000)
      }
    } catch (e: any) {
      console.error('[supplier settings] openai key save failed', e)
      setKeyMsg({ type: 'error', text: 'API 키 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
    }
    setKeyLoading(false)
  }

  const saveGeminiKey = async () => {
    if (!geminiInput.trim()) return setGeminiMsg({ type: 'error', text: 'Gemini API 키를 입력해주세요.' })
    setGeminiLoading(true); setGeminiMsg(null)
    try {
      const res = await fetch('/api/user-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: geminiInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[supplier settings] gemini key save failed', data)
        setGeminiMsg({ type: 'error', text: 'Gemini 키 저장에 실패했습니다. 입력한 키를 확인해 주세요.' })
      } else {
        setGeminiMsg({ type: 'success', text: '✅ Gemini 키가 저장됐어요!' })
        setGeminiInput('')
        fetchKeyInfo()
        setTimeout(() => setGeminiMsg(null), 3000)
      }
    } catch (e: any) {
      console.error('[supplier settings] gemini key save failed', e)
      setGeminiMsg({ type: 'error', text: 'Gemini 키 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
    }
    setGeminiLoading(false)
  }

  const deleteKey = async () => {
    if (!confirm('API 키를 삭제하시겠습니까?')) return
    await fetch('/api/user-key', { method: 'DELETE' })
    setKeyInfo(null)
    setKeyMsg({ type: 'success', text: '키가 삭제됐어요.' })
    setTimeout(() => setKeyMsg(null), 2000)
  }

  const changePw = async () => {
    if (!curPw || !newPw || !confirmPw)
      return setPwMsg({ type: 'error', text: '모든 항목을 입력해주세요.' })
    if (newPw !== confirmPw)
      return setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
    if (newPw.length < 6)
      return setPwMsg({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' })
    setPwLoading(true); setPwMsg(null)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: curPw,
    })
    if (signInErr) {
      setPwLoading(false)
      return setPwMsg({ type: 'error', text: '현재 비밀번호가 올바르지 않습니다.' })
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      console.error('[supplier settings] password change failed', error)
      setPwMsg({ type: 'error', text: '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
    } else {
      setPwMsg({ type: 'success', text: '✅ 비밀번호가 변경됐어요!' })
      setCurPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwMsg(null), 3000)
    }
    setPwLoading(false)
  }

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 8 ? 2 : newPw.length < 12 ? 3 : 4
  const pwStrengthColor = ['', '#f87171', '#fbbf24', '#fbbf24', '#34d399'][pwStrength]
  const pwStrengthLabel = ['', '너무 짧아요', '보통', '좋아요', '매우 강함'][pwStrength]

  const inputBase: React.CSSProperties = {
    width: '100%', background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: '14px', padding: '15px 18px', fontSize: '15px',
    color: t.text, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
  const labelBase: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: t.textMuted, marginBottom: '10px', letterSpacing: '0.8px', textTransform: 'uppercase',
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: '18px', fontWeight: 800, color: t.text, margin: '0 0 6px',
  }
  const sectionSub: React.CSSProperties = {
    fontSize: '13px', color: t.textMuted, margin: '0 0 28px',
  }
  const divider: React.CSSProperties = {
    height: '1px', background: t.border, margin: '24px 0',
  }

  return (
    <SettingsView
      t={t}
      keyInfo={keyInfo}
      keyInput={keyInput}
      setKeyInput={setKeyInput}
      showKey={showKey}
      setShowKey={setShowKey}
      keyLoading={keyLoading}
      keyMsg={keyMsg}
      geminiInput={geminiInput}
      setGeminiInput={setGeminiInput}
      showGemini={showGemini}
      setShowGemini={setShowGemini}
      geminiLoading={geminiLoading}
      geminiMsg={geminiMsg}
      curPw={curPw}
      setCurPw={setCurPw}
      newPw={newPw}
      setNewPw={setNewPw}
      confirmPw={confirmPw}
      setConfirmPw={setConfirmPw}
      showCur={showCur}
      setShowCur={setShowCur}
      showNew={showNew}
      setShowNew={setShowNew}
      showCfm={showCfm}
      setShowCfm={setShowCfm}
      pwLoading={pwLoading}
      pwMsg={pwMsg}
      saveKey={saveKey}
      saveGeminiKey={saveGeminiKey}
      deleteKey={deleteKey}
      changePw={changePw}
      pwStrength={pwStrength}
      pwStrengthColor={pwStrengthColor}
      pwStrengthLabel={pwStrengthLabel}
      inputBase={inputBase}
      labelBase={labelBase}
      sectionTitle={sectionTitle}
      sectionSub={sectionSub}
      divider={divider}
    />
  )
}

export default function SupplierSettingsPage() {
  return (
    <SupplierLayout>
      <SettingsContent />
    </SupplierLayout>
  )
}
