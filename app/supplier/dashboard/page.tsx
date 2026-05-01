'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'

export default function SupplierDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [supplier, setSupplier] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/supplier/login'); return }

    const [{ data: sup }, { data: prods }] = await Promise.all([
      supabase.from('suppliers').select('*').eq('id', user.id).single(),
      supabase.from('products').select('approval_status').eq('supplier_id', user.id)
    ])

    if (!sup) { router.push('/supplier/login'); return }
    setSupplier(sup)

    const products = prods || []
    setStats({
      total:    products.length,
      pending:  products.filter(p => p.approval_status === '대기중').length,
      approved: products.filter(p => p.approval_status === '승인').length,
      rejected: products.filter(p => p.approval_status === '거절').length,
    })
    setLoading(false)
  }

  if (loading) return (
    <SupplierLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">불러오는 중...</p>
      </div>
    </SupplierLayout>
  )

  const statusColorMap: Record<string, string> = {
    '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500',
  }
  const statusColor = statusColorMap[supplier.status] || ''

  return (
    <SupplierLayout>
      <div className="animate-fadeIn">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            안녕하세요, {supplier.company_name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor}`}>
              {supplier.status === '승인' ? '✅ 승인된 공급업체' : supplier.status === '대기중' ? '⏳ 승인 대기중' : '❌ 거절됨'}
            </span>
            <p className="text-slate-400 text-sm">{new Date(supplier.created_at).toLocaleDateString('ko-KR')} 가입</p>
          </div>
        </div>

        {/* 승인 대기 안내 */}
        {supplier.status === '대기중' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6">
            <p className="text-amber-700 dark:text-amber-400 font-semibold">⏳ 관리자 승인을 기다리고 있습니다</p>
            <p className="text-amber-600 dark:text-amber-500 text-sm mt-1">승인 완료 후 상품을 등록하실 수 있습니다. 영업일 기준 1~2일 소요됩니다.</p>
          </div>
        )}

        {/* 상품 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '전체 상품', value: stats.total,    color: 'text-slate-700 dark:text-slate-200',   bg: 'bg-white dark:bg-gray-800' },
            { label: '승인 대기', value: stats.pending,  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: '쇼핑몰 노출', value: stats.approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: '거절',    value: stats.rejected, color: 'text-red-500',                          bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-slate-100 dark:border-gray-700 shadow-sm`}>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 업체 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">업체 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: '업체명',     value: supplier.company_name },
              { label: '대표자',     value: supplier.representative || '-' },
              { label: '사업자번호', value: supplier.business_number || '-' },
              { label: '연락처',     value: supplier.contact || '-' },
              { label: '주소',       value: supplier.address || '-' },
              { label: '취급 품목',  value: supplier.category || '-' },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 dark:text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SupplierLayout>
  )
}
