'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import TaxView from './_TaxView'

type TaxInvoice = {
  id: string; invoice_number: string; company_name: string; business_number: string
  manager_name: string; contact: string; amount: number; tax_amount: number
  total_amount: number; note: string; status: string; issued_at: string; created_at: string
}
type CashReceipt = {
  id: string; receipt_number: string; customer_name: string; contact: string
  amount: number; receipt_type: string; note: string; status: string; issued_at: string; created_at: string
}


export default function TaxPage() {
  const [tab, setTab] = useState<'invoice' | 'receipt'>('invoice')
  const [invoices, setInvoices] = useState<TaxInvoice[]>([])
  const [receipts, setReceipts] = useState<CashReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<TaxInvoice | null>(null)
  const [editReceipt, setEditReceipt] = useState<CashReceipt | null>(null)
  const [iForm, setIForm] = useState({ company_name: '', business_number: '', manager_name: '', contact: '', amount: '', note: '', status: '미발행' })
  const [rForm, setRForm] = useState({ customer_name: '', contact: '', amount: '', receipt_type: '소비자용', note: '', status: '미발행' })
  const [autoIssue, setAutoIssue] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: inv }, { data: rec }, { data: setting }] = await Promise.all([
      supabase.from('tax_invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('cash_receipts').select('*').order('created_at', { ascending: false }),
      supabase.from('system_settings').select('value').eq('key', 'auto_issue').maybeSingle(),
    ])
    setInvoices(inv || [])
    setReceipts(rec || [])
    setAutoIssue(setting?.value === 'on')
    setLoading(false)
  }

  const toggleAutoIssue = async () => {
    const next = autoIssue ? 'off' : 'on'
    setAutoIssue(!autoIssue)
    await supabase.from('system_settings').delete().eq('key', 'auto_issue')
    await supabase.from('system_settings').insert({ key: 'auto_issue', value: next, updated_at: new Date().toISOString() })
  }

  const resetForm = () => {
    setIForm({ company_name: '', business_number: '', manager_name: '', contact: '', amount: '', note: '', status: '미발행' })
    setRForm({ customer_name: '', contact: '', amount: '', receipt_type: '소비자용', note: '', status: '미발행' })
    setEditInvoice(null); setEditReceipt(null); setShowForm(false)
  }

  const openEditI = (inv: TaxInvoice) => {
    setEditInvoice(inv)
    setIForm({ company_name: inv.company_name, business_number: inv.business_number || '', manager_name: inv.manager_name || '', contact: inv.contact || '', amount: String(inv.amount), note: inv.note || '', status: inv.status })
    setShowForm(true)
  }

  const openEditR = (rec: CashReceipt) => {
    setEditReceipt(rec)
    setRForm({ customer_name: rec.customer_name, contact: rec.contact || '', amount: String(rec.amount), receipt_type: rec.receipt_type, note: rec.note || '', status: rec.status })
    setShowForm(true)
  }

  const saveInvoice = async () => {
    if (!iForm.company_name) return alert('업체명을 입력해주세요.')
    if (!iForm.amount) return alert('금액을 입력해주세요.')
    const amount = Number(iForm.amount)
    const tax_amount = Math.round(amount * 0.1)
    const total_amount = amount + tax_amount
    const issued_at = iForm.status === '발행완료' ? new Date().toISOString() : null
    const data = { ...iForm, amount, tax_amount, total_amount, issued_at }
    if (editInvoice) {
      await supabase.from('tax_invoices').update(data).eq('id', editInvoice.id)
    } else {
      await supabase.from('tax_invoices').insert(data)
    }
    resetForm(); fetchAll()
  }

  const saveReceipt = async () => {
    if (!rForm.customer_name) return alert('고객명을 입력해주세요.')
    if (!rForm.amount) return alert('금액을 입력해주세요.')
    const issued_at = rForm.status === '발행완료' ? new Date().toISOString() : null
    const data = { ...rForm, amount: Number(rForm.amount), issued_at }
    if (editReceipt) {
      await supabase.from('cash_receipts').update(data).eq('id', editReceipt.id)
    } else {
      await supabase.from('cash_receipts').insert(data)
    }
    resetForm(); fetchAll()
  }

  const updateInvoiceStatus = async (id: string, status: string) => {
    // '발행취소'로 바꿀 때, 이미 팝빌 발행된 건이면 국세청 취소발행 호출 (환불 시)
    if (status === '발행취소') {
      const inv = invoices.find(i => i.id === id)
      if (inv && inv.status === '발행완료') {
        if (!confirm('이미 발행된 세금계산서입니다. 국세청에 취소발행을 요청할까요?')) return
        const res = await fetch('/api/tax/issue', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'cancel-invoice', id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { console.error('[admin tax cancel invoice] failed', data); alert('팝빌 세금계산서 취소에 실패했습니다. 서버 로그를 확인해 주세요.'); return }
      }
      await supabase.from('tax_invoices').update({ status: '발행취소' }).eq('id', id)
      fetchAll(); return
    }
    // '발행완료'로 바꿀 때 팝빌로 전자세금계산서 실제 발행
    if (status === '발행완료') {
      const inv = invoices.find(i => i.id === id)
      if (inv && inv.status !== '발행완료') {
        const res = await fetch('/api/tax/issue', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'invoice', id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { console.error('[admin tax issue invoice] failed', data); alert('팝빌 세금계산서 발행에 실패했습니다. 서버 로그를 확인해 주세요.'); return }
        await supabase.from('tax_invoices').update({ status, issued_at: new Date().toISOString(), invoice_number: data.mgtKey || inv.invoice_number }).eq('id', id)
        fetchAll(); return
      }
    }
    const issued_at = status === '발행완료' ? new Date().toISOString() : null
    await supabase.from('tax_invoices').update({ status, issued_at }).eq('id', id)
    fetchAll()
  }

  const updateReceiptStatus = async (id: string, status: string) => {
    // '발행취소'로 바꿀 때, 이미 팝빌 발행된 건이면 국세청 취소발행 호출 (환불 시)
    if (status === '발행취소') {
      const rec = receipts.find(r => r.id === id)
      if (rec && rec.status === '발행완료') {
        if (!confirm('이미 발행된 현금영수증입니다. 국세청에 취소발행을 요청할까요?')) return
        const res = await fetch('/api/tax/issue', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'cancel-receipt', id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { console.error('[admin tax cancel receipt] failed', data); alert('팝빌 현금영수증 취소에 실패했습니다. 서버 로그를 확인해 주세요.'); return }
      }
      await supabase.from('cash_receipts').update({ status: '발행취소' }).eq('id', id)
      fetchAll(); return
    }
    // '발행완료'로 바꿀 때 팝빌로 현금영수증 실제 발행
    if (status === '발행완료') {
      const rec = receipts.find(r => r.id === id)
      if (rec && rec.status !== '발행완료') {
        const res = await fetch('/api/tax/issue', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'receipt', id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { console.error('[admin tax issue receipt] failed', data); alert('팝빌 현금영수증 발행에 실패했습니다. 서버 로그를 확인해 주세요.'); return }
        await supabase.from('cash_receipts').update({ status, issued_at: new Date().toISOString(), receipt_number: data.mgtKey || rec.receipt_number }).eq('id', id)
        fetchAll(); return
      }
    }
    const issued_at = status === '발행완료' ? new Date().toISOString() : null
    await supabase.from('cash_receipts').update({ status, issued_at }).eq('id', id)
    fetchAll()
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('tax_invoices').delete().eq('id', id)
    fetchAll()
  }

  const deleteReceipt = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('cash_receipts').delete().eq('id', id)
    fetchAll()
  }

  const unpaidInvoices = invoices.filter(i => i.status === '미발행').length
  const unpaidReceipts = receipts.filter(r => r.status === '미발행').length

  return (
    <TaxView
      tab={tab}
      setTab={setTab}
      invoices={invoices}
      receipts={receipts}
      loading={loading}
      showForm={showForm}
      editInvoice={editInvoice}
      editReceipt={editReceipt}
      iForm={iForm}
      setIForm={setIForm}
      rForm={rForm}
      setRForm={setRForm}
      autoIssue={autoIssue}
      toggleAutoIssue={toggleAutoIssue}
      resetForm={resetForm}
      openEditI={openEditI}
      openEditR={openEditR}
      saveInvoice={saveInvoice}
      saveReceipt={saveReceipt}
      updateInvoiceStatus={updateInvoiceStatus}
      updateReceiptStatus={updateReceiptStatus}
      deleteInvoice={deleteInvoice}
      deleteReceipt={deleteReceipt}
      unpaidInvoices={unpaidInvoices}
      unpaidReceipts={unpaidReceipts}
      setShowForm={setShowForm}
    />
  )
}
