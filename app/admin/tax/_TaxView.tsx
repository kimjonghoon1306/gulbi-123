'use client'

import type { Dispatch, SetStateAction } from 'react'

type TaxInvoice = {
  id: string; invoice_number: string; company_name: string; business_number: string
  manager_name: string; contact: string; amount: number; tax_amount: number
  total_amount: number; note: string; status: string; issued_at: string; created_at: string
}
type CashReceipt = {
  id: string; receipt_number: string; customer_name: string; contact: string
  amount: number; receipt_type: string; note: string; status: string; issued_at: string; created_at: string
}
type InvoiceForm = { company_name: string; business_number: string; manager_name: string; contact: string; amount: string; note: string; status: string }
type ReceiptForm = { customer_name: string; contact: string; amount: string; receipt_type: string; note: string; status: string }

type TaxViewProps = {
  tab: 'invoice' | 'receipt'
  setTab: Dispatch<SetStateAction<'invoice' | 'receipt'>>
  invoices: TaxInvoice[]
  receipts: CashReceipt[]
  loading: boolean
  showForm: boolean
  editInvoice: TaxInvoice | null
  editReceipt: CashReceipt | null
  iForm: InvoiceForm
  setIForm: Dispatch<SetStateAction<InvoiceForm>>
  rForm: ReceiptForm
  setRForm: Dispatch<SetStateAction<ReceiptForm>>
  autoIssue: boolean
  toggleAutoIssue: () => Promise<void>
  resetForm: () => void
  openEditI: (inv: TaxInvoice) => void
  openEditR: (rec: CashReceipt) => void
  saveInvoice: () => Promise<void>
  saveReceipt: () => Promise<void>
  updateInvoiceStatus: (id: string, status: string) => Promise<void>
  updateReceiptStatus: (id: string, status: string) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  deleteReceipt: (id: string) => Promise<void>
  unpaidInvoices: number
  unpaidReceipts: number
  setShowForm: Dispatch<SetStateAction<boolean>>
}

const STATUS_COLOR: Record<string, string> = {
  '미발행': 'bg-red-100 dark:bg-red-900/30 text-red-500',
  '발행완료': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '발행안함': 'bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-slate-500',
  '발행취소': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
}

export default function TaxView({
  tab, setTab, invoices, receipts, loading, showForm, editInvoice, editReceipt,
  iForm, setIForm, rForm, setRForm, autoIssue, toggleAutoIssue, resetForm,
  openEditI, openEditR, saveInvoice, saveReceipt, updateInvoiceStatus, updateReceiptStatus,
  deleteInvoice, deleteReceipt, unpaidInvoices, unpaidReceipts, setShowForm,
}: TaxViewProps) {
  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">세금계산서 · 현금영수증</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">발행 내역 등록 및 관리</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-indigo-500/20">
          + 발행 등록
        </button>
      </div>

      {/* 증빙 자동발행 설정 */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">⚡ 증빙 자동발행 <span className={autoIssue ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>{autoIssue ? '(자동)' : '(수동)'}</span></p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {autoIssue
                ? '켜짐 — 입금이 확인되면 손님이 고른 증빙(현금영수증·세금계산서)을 자동으로 발행해요.'
                : '꺼짐 — 증빙은 ‘미발행’으로 쌓이고, 관리자가 아래에서 ‘발행하기’ 버튼을 직접 눌러요.'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">※ 손님이 ‘발행안함’을 고르면 발행 대상이 아니에요. 발행 실패 건은 미발행으로 남아 직접 발행할 수 있어요.</p>
          </div>
          <button onClick={toggleAutoIssue}
            className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${autoIssue ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${autoIssue ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      {/* 미발행 알림 */}
      {(unpaidInvoices > 0 || unpaidReceipts > 0) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 flex gap-4 flex-wrap">
          {unpaidInvoices > 0 && (
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">⚠️ 미발행 세금계산서 {unpaidInvoices}건</span>
          )}
          {unpaidReceipts > 0 && (
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">⚠️ 미발행 현금영수증 {unpaidReceipts}건</span>
          )}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'invoice', label: '🧾 세금계산서', count: invoices.length },
          { key: 'receipt', label: '🧾 현금영수증', count: receipts.length }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
              ${tab === t.key ? 'bg-indigo-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* 세금계산서 목록 */}
      {tab === 'invoice' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center text-slate-400">불러오는 중...</div>
          ) : invoices.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-gray-700">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">발행 내역이 없습니다</p>
            </div>
          ) : invoices.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLOR[inv.status]}`}>{inv.status}</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{inv.company_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{inv.invoice_number} {inv.business_number && `· ${inv.business_number}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-white">{inv.total_amount.toLocaleString()}원</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">부가세 {inv.tax_amount.toLocaleString()}원</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditI(inv)} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">수정</button>
                    <button onClick={() => deleteInvoice(inv.id)} className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-gray-700">
                {inv.status !== '발행완료' ? (
                  <>
                    <button onClick={() => { if (confirm('이 세금계산서를 국세청에 발행할까요?\n(팝빌로 즉시 발행됩니다)')) updateInvoiceStatus(inv.id, '발행완료') }}
                      className="flex-[2] py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
                      🧾 세금계산서 발행하기
                    </button>
                    <button onClick={() => updateInvoiceStatus(inv.id, '발행안함')}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${inv.status === '발행안함' ? 'bg-slate-400 text-white' : 'bg-slate-50 dark:bg-gray-700 text-slate-400 hover:bg-slate-100'}`}>
                      발행안함
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-[2] py-2 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-center">✅ 발행완료</span>
                    <button onClick={() => { if (confirm('발행된 세금계산서를 취소할까요?\n(팝빌로 취소 발행됩니다)')) updateInvoiceStatus(inv.id, '발행취소') }}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all">
                      발행취소
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 현금영수증 목록 */}
      {tab === 'receipt' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center text-slate-400">불러오는 중...</div>
          ) : receipts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-gray-700">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">발행 내역이 없습니다</p>
            </div>
          ) : receipts.map(rec => (
            <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLOR[rec.status]}`}>{rec.status}</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{rec.customer_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{rec.receipt_number} · {rec.receipt_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-white">{rec.amount.toLocaleString()}원</p>
                    {rec.contact && <p className="text-xs text-slate-400 dark:text-slate-500">{rec.contact}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditR(rec)} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">수정</button>
                    <button onClick={() => deleteReceipt(rec.id)} className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-gray-700">
                {rec.status !== '발행완료' ? (
                  <>
                    <button onClick={() => { if (confirm('이 현금영수증을 국세청에 발행할까요?\n(팝빌로 즉시 발행됩니다)')) updateReceiptStatus(rec.id, '발행완료') }}
                      className="flex-[2] py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
                      🧾 현금영수증 발행하기
                    </button>
                    <button onClick={() => updateReceiptStatus(rec.id, '발행안함')}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${rec.status === '발행안함' ? 'bg-slate-400 text-white' : 'bg-slate-50 dark:bg-gray-700 text-slate-400 hover:bg-slate-100'}`}>
                      발행안함
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-[2] py-2 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-center">✅ 발행완료</span>
                    <button onClick={() => { if (confirm('발행된 현금영수증을 취소할까요?\n(팝빌로 취소 발행됩니다)')) updateReceiptStatus(rec.id, '발행취소') }}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all">
                      발행취소
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {tab === 'invoice' ? (editInvoice ? '세금계산서 수정' : '세금계산서 등록') : (editReceipt ? '현금영수증 수정' : '현금영수증 등록')}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {tab === 'invoice' ? (
                <>
                  {[
                    { label: '업체명 *', key: 'company_name', placeholder: '예) 목포 수산' },
                    { label: '사업자번호', key: 'business_number', placeholder: '000-00-00000' },
                    { label: '담당자', key: 'manager_name', placeholder: '담당자 이름' },
                    { label: '연락처', key: 'contact', placeholder: '010-0000-0000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(iForm as any)[f.key]}
                        onChange={e => setIForm({ ...iForm, [f.key]: e.target.value })}
                        className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">공급가액 (원) *</label>
                    <input type="number" placeholder="부가세 10% 자동 계산" value={iForm.amount}
                      onChange={e => setIForm({ ...iForm, amount: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {iForm.amount && (
                      <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-4 py-2 flex justify-between text-xs text-indigo-600 dark:text-indigo-400">
                        <span>부가세: {Math.round(Number(iForm.amount) * 0.1).toLocaleString()}원</span>
                        <span className="font-bold">합계: {(Number(iForm.amount) + Math.round(Number(iForm.amount) * 0.1)).toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">발행 상태</label>
                    <select value={iForm.status} onChange={e => setIForm({ ...iForm, status: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>미발행</option>
                      <option>발행완료</option>
                      <option>발행안함</option>
                      <option>발행취소</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모</label>
                    <textarea value={iForm.note} onChange={e => setIForm({ ...iForm, note: e.target.value })} rows={2}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                </>
              ) : (
                <>
                  {[
                    { label: '고객명 *', key: 'customer_name', placeholder: '예) 홍길동' },
                    { label: '연락처', key: 'contact', placeholder: '010-0000-0000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(rForm as any)[f.key]}
                        onChange={e => setRForm({ ...rForm, [f.key]: e.target.value })}
                        className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">금액 (원) *</label>
                    <input type="number" placeholder="0" value={rForm.amount}
                      onChange={e => setRForm({ ...rForm, amount: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">영수증 종류</label>
                    <select value={rForm.receipt_type} onChange={e => setRForm({ ...rForm, receipt_type: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>소비자용</option>
                      <option>사업자용</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">발행 상태</label>
                    <select value={rForm.status} onChange={e => setRForm({ ...rForm, status: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>미발행</option>
                      <option>발행완료</option>
                      <option>발행안함</option>
                      <option>발행취소</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모</label>
                    <textarea value={rForm.note} onChange={e => setRForm({ ...rForm, note: e.target.value })} rows={2}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={tab === 'invoice' ? saveInvoice : saveReceipt} className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-colors active:scale-95">
                {(tab === 'invoice' ? editInvoice : editReceipt) ? '수정 완료' : '등록 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}