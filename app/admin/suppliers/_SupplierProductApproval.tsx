'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SupplierApprovalTab from '../products/_SupplierApprovalTab'
import SupplierReviewModal from '../products/_SupplierReviewModal'

type Category = { id: string; name: string; sort_order: number }
type SupplierProduct = {
  id: string; name: string; description: string
  category_id: string; image_url: string; unit: string; stock: number
  suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number; member_price: number
  approval_status: string; supplier_id: string; is_active: boolean; created_at: string
  suppliers?: { company_name: string; contact: string }
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  '대기중': { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  '승인': { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  '거절': { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  '수정요청': { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
}

export default function SupplierProductApproval() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'대기중' | '승인' | '거절' | '수정요청'>('대기중')
  const [reviewProduct, setReviewProduct] = useState<SupplierProduct | null>(null)
  const [reviewForm, setReviewForm] = useState({
    name: '', wholesale_price: '', retail_price: '', member_price: '',
    category_id: '', unit: '', stock: '', description: '',
  })
  const [rejectReason, setRejectReason] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [okMsg, setOkMsg] = useState('')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    if (!okMsg) return
    const id = setTimeout(() => setOkMsg(''), 4000)
    return () => clearTimeout(id)
  }, [okMsg])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: supplierProducts }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*, suppliers(company_name, contact)')
        .not('supplier_id', 'is', null).order('created_at', { ascending: false }),
    ])
    setCategories(cats || [])
    setProducts(supplierProducts || [])
    setLoading(false)
  }

  const openReview = (product: SupplierProduct) => {
    setReviewProduct(product)
    setReviewForm({
      name: product.name,
      wholesale_price: String(product.wholesale_price || product.suggested_wholesale_price || ''),
      member_price: String(product.member_price || product.suggested_retail_price || ''),
      retail_price: String(product.retail_price || ''),
      category_id: product.category_id || '',
      unit: product.unit || 'kg',
      stock: String(product.stock || ''),
      description: product.description || '',
    })
    setRejectReason('')
    setShowRejectInput(false)
  }

  const handleApprove = async () => {
    if (!reviewProduct) return
    if (!reviewForm.retail_price || Number(reviewForm.retail_price) <= 0) {
      alert('일반 구매가를 입력해주세요.')
      return
    }
    setReviewLoading(true)
    const { error } = await supabase.from('products').update({
      name: reviewForm.name,
      wholesale_price: Number(reviewForm.wholesale_price) || 0,
      retail_price: Number(reviewForm.retail_price) || 0,
      member_price: Number(reviewForm.member_price) || 0,
      category_id: reviewForm.category_id || null,
      unit: reviewForm.unit,
      stock: Number(reviewForm.stock) || 0,
      description: reviewForm.description,
      approval_status: '승인',
      is_active: true,
      rejection_reason: null,
    }).eq('id', reviewProduct.id)
    setReviewLoading(false)
    if (error) {
      console.error('[admin supplier product approve] failed', error)
      alert('상품 승인 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
      return
    }
    setReviewProduct(null)
    setOkMsg('✅ 가격이 확정되어 쇼핑몰에 노출되었습니다.')
    fetchAll()
  }

  const updateReviewStatus = async (status: '거절' | '수정요청') => {
    if (!reviewProduct || !rejectReason.trim()) return
    setReviewLoading(true)
    const { error } = await supabase.from('products').update({
      approval_status: status,
      is_active: false,
      rejection_reason: rejectReason.trim(),
    }).eq('id', reviewProduct.id)
    setReviewLoading(false)
    if (error) {
      console.error('[admin supplier product review] failed', error)
      alert(status === '거절' ? '상품 거절 처리에 실패했습니다.' : '수정요청 저장에 실패했습니다.')
      return
    }
    setReviewProduct(null)
    setShowRejectInput(false)
    setOkMsg(status === '거절' ? '거절 처리되었습니다. 공급업체에 사유가 전달됩니다.' : '수정요청을 보냈습니다. 공급업체가 수정 후 재신청합니다.')
    fetchAll()
  }

  const filteredProducts = products.filter(product => product.approval_status === filter)

  return (
    <div>
      {okMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', maxWidth: '90vw', textAlign: 'center' }}>
          {okMsg}
        </div>
      )}
      <SupplierApprovalTab
        loading={loading}
        approvalFilter={filter}
        setApprovalFilter={setFilter}
        supplierProducts={products}
        filteredSupplierProducts={filteredProducts}
        statusStyle={STATUS_STYLE}
        openReview={openReview}
      />
      <SupplierReviewModal
        reviewProduct={reviewProduct}
        setReviewProduct={setReviewProduct}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        categories={categories}
        showRejectInput={showRejectInput}
        setShowRejectInput={setShowRejectInput}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        reviewLoading={reviewLoading}
        handleApprove={handleApprove}
        handleReject={() => updateReviewStatus('거절')}
        handleRequestRevision={() => updateReviewStatus('수정요청')}
      />
    </div>
  )
}
