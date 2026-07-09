'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import AdsView from './_AdsView'
import { IMAGE_LIBRARY } from './_imageLibrary'

type Banner = {
  id: string
  tag: string | null
  title: string | null
  subtitle: string | null
  cta_label: string | null
  image_url: string
  product_id: string | null
  link_url: string | null
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
}

type ProductLite = { id: string; name: string }

const EMPTY = {
  tag: '', title: '', subtitle: '', cta_label: '', image_url: '', product_id: '', link_url: '',
  sort_order: '0', starts_at: '', ends_at: '', is_active: true,
}

// ISO → datetime-local 입력값 (로컬 타임존)
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

type Status = 'live' | 'scheduled' | 'expired' | 'off'
const statusOf = (b: Banner): Status => {
  if (!b.is_active) return 'off'
  const now = Date.now()
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return 'scheduled'
  if (b.ends_at && new Date(b.ends_at).getTime() < now) return 'expired'
  return 'live'
}

export default function AdminAdsPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [products, setProducts] = useState<ProductLite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [libCat, setLibCat] = useState(IMAGE_LIBRARY[0].key)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('ad_banners').select('*').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').eq('is_active', true).order('name'),
    ])
    setBanners((b as any) || [])
    setProducts((p as any) || [])
    setLoading(false)
  }

  const openNew = () => { setEditId(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (b: Banner) => {
    setEditId(b.id)
    setForm({
      tag: b.tag || '', title: b.title || '', subtitle: b.subtitle || '', cta_label: b.cta_label || '',
      image_url: b.image_url, product_id: b.product_id || '',
      link_url: b.link_url || '', sort_order: String(b.sort_order),
      starts_at: toLocalInput(b.starts_at), ends_at: toLocalInput(b.ends_at), is_active: b.is_active,
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    const fn = 'banners/' + Date.now() + '.' + (f.name.split('.').pop() || 'jpg')
    const { error } = await supabase.storage.from('products').upload(fn, f, { upsert: true })
    if (!error) {
      const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      setForm(prev => ({ ...prev, image_url: url }))
    } else {
      alert('이미지 업로드 실패: ' + error.message)
    }
    setUploading(false)
  }

  const save = async () => {
    if (!form.image_url) return alert('배너 이미지를 올려주세요.')
    if (form.starts_at && form.ends_at && new Date(form.starts_at) >= new Date(form.ends_at))
      return alert('종료 일시가 시작 일시보다 빨라요. 다시 확인해 주세요.')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload: any = {
      tag: form.tag.trim() || null,
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      cta_label: form.cta_label.trim() || null,
      image_url: form.image_url,
      product_id: form.product_id || null,
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active,
    }
    let error
    if (editId) {
      ({ error } = await supabase.from('ad_banners').update(payload).eq('id', editId))
    } else {
      payload.created_by = user?.id
      ;({ error } = await supabase.from('ad_banners').insert(payload))
    }
    setSaving(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setShowForm(false); setForm(EMPTY); setEditId(null); fetchAll()
  }

  const toggleActive = async (b: Banner) => {
    await supabase.from('ad_banners').update({ is_active: !b.is_active }).eq('id', b.id)
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
  }

  const remove = async (id: string) => {
    if (!confirm('이 광고 배너를 삭제할까요?')) return
    await supabase.from('ad_banners').delete().eq('id', id)
    setBanners(prev => prev.filter(x => x.id !== id))
  }

  const productName = (id: string | null) => id ? (products.find(p => p.id === id)?.name || '삭제된 상품') : null
  const counts = {
    total: banners.length,
    live: banners.filter(b => statusOf(b) === 'live').length,
    scheduled: banners.filter(b => statusOf(b) === 'scheduled').length,
    ended: banners.filter(b => ['expired', 'off'].includes(statusOf(b))).length,
  }

  return (
    <AdsView
      banners={banners}
      products={products}
      loading={loading}
      showForm={showForm}
      setShowForm={setShowForm}
      editId={editId}
      form={form}
      setForm={setForm}
      saving={saving}
      uploading={uploading}
      showLibrary={showLibrary}
      setShowLibrary={setShowLibrary}
      libCat={libCat}
      setLibCat={setLibCat}
      openNew={openNew}
      openEdit={openEdit}
      handleImageUpload={handleImageUpload}
      save={save}
      toggleActive={toggleActive}
      remove={remove}
      productName={productName}
      counts={counts}
    />
  )
}
