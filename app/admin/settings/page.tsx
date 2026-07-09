'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import SettingsView from './_SettingsView'

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeSection, setActiveSection] = useState('account')
  const [fishMood, setFishMood] = useState('😄')
  const [bubbles, setBubbles] = useState<{id:number,x:number,size:number,delay:number}[]>([])
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiKeyMsg, setOpenaiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openaiKeyLoading, setOpenaiKeyLoading] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [geminiKeyMsg, setGeminiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [geminiKeyLoading, setGeminiKeyLoading] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  // 등록된 키 상태(힌트) — 입력칸과 별개로 "등록됨" 여부를 항상 보여줌
  const [openaiSaved, setOpenaiSaved] = useState<string | null>(null)
  const [geminiSaved, setGeminiSaved] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchOpenaiKey()
    setBubbles(Array.from({length: 8}, (_, i) => ({
      id: i, x: 10 + i * 12, size: 20 + Math.random() * 30, delay: Math.random() * 4
    })))
  }, [])

  const fetchOpenaiKey = async () => {
    try {
      const res = await fetch('/api/user-key')
      if (res.ok) {
        const data = await res.json()
        // 입력칸엔 넣지 않고(마스킹 혼동 방지), 등록 상태만 별도 표시
        setOpenaiSaved(data.keyHint || null)
        setGeminiSaved(data.geminiKeyHint || null)
      }
    } catch {}
  }

  const saveOpenaiKey = async () => {
    if (!openaiKey.trim()) return setOpenaiKeyMsg({ type: 'error', text: 'API 키를 입력해주세요.' })
    if (openaiKey.startsWith('sk-') === false && openaiKey.includes('...')) {
      return setOpenaiKeyMsg({ type: 'error', text: '새 키를 입력해주세요. (현재 표시된 것은 마스킹된 힌트입니다)' })
    }
    setOpenaiKeyLoading(true)
    setOpenaiKeyMsg(null)
    try {
      const res = await fetch('/api/user-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiKey: openaiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOpenaiKeyMsg({ type: 'error', text: data.error || '저장 실패' })
      } else {
        setOpenaiKeyMsg({ type: 'success', text: '✅ API 키가 저장됐어요!' })
        setOpenaiSaved(data.keyHint || null)
        setOpenaiKey('')
        setTimeout(() => setOpenaiKeyMsg(null), 3000)
      }
    } catch (e: any) {
      setOpenaiKeyMsg({ type: 'error', text: e.message })
    }
    setOpenaiKeyLoading(false)
  }

  const saveGeminiKey = async () => {
    if (!geminiKey.trim()) return setGeminiKeyMsg({ type: 'error', text: 'API 키를 입력해주세요.' })
    if (geminiKey.includes('...')) {
      return setGeminiKeyMsg({ type: 'error', text: '새 키를 입력해주세요. (현재 표시된 것은 마스킹된 힌트입니다)' })
    }
    setGeminiKeyLoading(true)
    setGeminiKeyMsg(null)
    try {
      const res = await fetch('/api/user-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: geminiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGeminiKeyMsg({ type: 'error', text: data.error || '저장 실패' })
      } else {
        setGeminiKeyMsg({ type: 'success', text: '✅ Gemini API 키가 저장됐어요!' })
        setGeminiSaved(data.geminiKeyHint || null)
        setGeminiKey('')
        setTimeout(() => setGeminiKeyMsg(null), 3000)
      }
    } catch (e: any) {
      setGeminiKeyMsg({ type: 'error', text: e.message })
    }
    setGeminiKeyLoading(false)
  }

  const handleChangePw = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setFishMood('😤')
      return setPwMsg({ type: 'error', text: '모든 항목을 입력해주세요!' })
    }
    if (newPw !== confirmPw) {
      setFishMood('😵')
      return setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않아요!' })
    }
    if (newPw.length < 6) {
      setFishMood('😬')
      return setPwMsg({ type: 'error', text: '비밀번호는 6자 이상이어야 해요!' })
    }
    setPwLoading(true)
    setPwMsg(null)
    setFishMood('🤔')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw })
    if (signInError) {
      setFishMood('😱')
      setPwMsg({ type: 'error', text: '현재 비밀번호가 틀렸어요!' })
      setPwLoading(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setFishMood('😢')
      setPwMsg({ type: 'error', text: `오류: ${error.message}` })
    } else {
      setFishMood('🥳')
      setPwMsg({ type: 'success', text: '비밀번호가 변경됐어요!' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setFishMood('😄'), 3000)
    }
    setPwLoading(false)
  }

  const sections = [
    { key: 'account', icon: '👤', label: '계정' },
    { key: 'security', icon: '🔐', label: '보안' },
    { key: 'apikey', icon: '🤖', label: 'AI 키' },
    { key: 'info', icon: 'ℹ️', label: '시스템' },
  ]

  return (
    <SettingsView
      currentPw={currentPw}
      setCurrentPw={setCurrentPw}
      newPw={newPw}
      setNewPw={setNewPw}
      confirmPw={confirmPw}
      setConfirmPw={setConfirmPw}
      showCurrent={showCurrent}
      setShowCurrent={setShowCurrent}
      showNew={showNew}
      setShowNew={setShowNew}
      showConfirm={showConfirm}
      setShowConfirm={setShowConfirm}
      pwLoading={pwLoading}
      pwMsg={pwMsg}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      fishMood={fishMood}
      setFishMood={setFishMood}
      bubbles={bubbles}
      openaiKey={openaiKey}
      setOpenaiKey={setOpenaiKey}
      openaiKeyMsg={openaiKeyMsg}
      openaiKeyLoading={openaiKeyLoading}
      showOpenaiKey={showOpenaiKey}
      setShowOpenaiKey={setShowOpenaiKey}
      geminiKey={geminiKey}
      setGeminiKey={setGeminiKey}
      geminiKeyMsg={geminiKeyMsg}
      geminiKeyLoading={geminiKeyLoading}
      showGeminiKey={showGeminiKey}
      setShowGeminiKey={setShowGeminiKey}
      openaiSaved={openaiSaved}
      geminiSaved={geminiSaved}
      handleChangePw={handleChangePw}
      saveOpenaiKey={saveOpenaiKey}
      saveGeminiKey={saveGeminiKey}
      sections={sections}
    />
  )
}
