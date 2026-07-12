'use client'

import Link from 'next/link'

type Props = {
  questions: any[]
  questionText: string
  setQuestionText: (v: string) => void
  questionSecret: boolean
  setQuestionSecret: (v: boolean) => void
  submitting: boolean
  submitQuestion: () => void
  D: any
  dark: boolean
  user: any
}

export function QuestionSection({
  questions, questionText, setQuestionText, questionSecret, setQuestionSecret,
  submitting, submitQuestion, D, dark, user,
}: Props) {
  return (
    <div id="questions" style={{ background:D.card, borderRadius:'24px', padding:'28px', marginBottom:'16px', border:`1px solid ${D.border}`, scrollMarginTop:'80px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
        <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#0f766e,#16a34a)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>💬</div>
        <div>
          <h2 style={{ fontSize:'17px', fontWeight:900, letterSpacing:'-0.3px', margin:0 }}>상품 Q&A</h2>
          <p style={{ fontSize:'12px', color:D.sub, margin:'3px 0 0' }}>원산지, 손질, 보관, 배송일, 선물포장을 문의하세요.</p>
        </div>
        {questions.length > 0 && (
          <span style={{ marginLeft:'auto', fontSize:'12px', fontWeight:900, color:D.gtext, background:dark?'rgba(74,222,128,0.12)':'rgba(22,163,74,0.1)', padding:'6px 11px', borderRadius:'999px' }}>
            문의 {questions.length}개
          </span>
        )}
      </div>

      {user ? (
        <div style={{ background:dark?'#15391f':'#f8fafc', borderRadius:'16px', padding:'18px', marginBottom:'20px', border:`1px solid ${D.border}` }}>
          <p style={{ fontSize:'14px', fontWeight:900, color:D.text, margin:'0 0 10px' }}>질문 작성</p>
          <textarea
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            placeholder="궁금한 점을 남겨주세요. 예: 선물포장 가능한가요? 배송일 지정 가능한가요?"
            rows={3}
            maxLength={700}
            style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', border:`2px solid ${D.border}`, background:D.card, color:D.text, fontSize:'14px', outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.65, fontFamily:'inherit' }}
          />
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'12px', flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:D.text, fontSize:'14px', fontWeight:800 }}>
              <input type="checkbox" checked={questionSecret} onChange={e => setQuestionSecret(e.target.checked)}
                style={{ width:'20px', height:'20px', accentColor:D.gtext }} />
              비밀글로 작성
            </label>
            <button
              onClick={submitQuestion}
              disabled={submitting || !questionText.trim()}
              style={{ marginLeft:'auto', padding:'13px 20px', borderRadius:'14px', border:'none', background:(submitting || !questionText.trim()) ? D.input : 'linear-gradient(135deg,#15803d,#16a34a)', color:(submitting || !questionText.trim()) ? D.sub : 'white', fontSize:'15px', fontWeight:900, cursor:(submitting || !questionText.trim()) ? 'not-allowed' : 'pointer', boxShadow:(submitting || !questionText.trim()) ? 'none' : '0 8px 20px rgba(22,163,74,0.25)' }}>
              {submitting ? '등록 중...' : '문의 등록'}
            </button>
          </div>
        </div>
      ) : (
        <Link href="/shop/login" style={{ display:'block', textAlign:'center', padding:'15px', background:D.input, color:D.sub, fontSize:'14px', fontWeight:800, borderRadius:'14px', textDecoration:'none', marginBottom:'20px' }}>
          로그인하고 상품 문의하기 →
        </Link>
      )}

      {questions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'26px 0', color:D.sub }}>
          <p style={{ fontSize:'34px', margin:'0 0 8px' }}>💬</p>
          <p style={{ fontSize:'14px', fontWeight:700, margin:0 }}>아직 문의가 없어요. 궁금한 점을 남겨주세요.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {questions.map((q:any) => {
            const answered = !!q.answer || !!q.has_answer
            return (
              <div key={q.id} style={{ padding:'17px', background:dark?'#15391f':'#f8fafc', borderRadius:'16px', border:`1px solid ${D.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
                  <span style={{ fontSize:'12px', fontWeight:900, color:answered ? '#15803d' : '#b45309', background:answered ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.14)', border:`1px solid ${answered ? 'rgba(22,163,74,0.22)' : 'rgba(245,158,11,0.24)'}`, padding:'6px 10px', borderRadius:'999px' }}>
                    {answered ? '답변완료' : '답변대기'}
                  </span>
                  {q.is_secret && <span style={{ fontSize:'12px', fontWeight:900, color:D.sub, background:D.card, border:`1px solid ${D.border}`, padding:'6px 10px', borderRadius:'999px' }}>비밀글</span>}
                  <span style={{ marginLeft:'auto', fontSize:'12px', color:D.sub }}>{q.created_at ? new Date(q.created_at).toLocaleDateString('ko-KR') : ''}</span>
                </div>
                {q.is_redacted ? (
                  <p style={{ fontSize:'15px', fontWeight:900, color:D.sub, margin:0 }}>🔒 비밀글입니다.</p>
                ) : (
                  <>
                    <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <span style={{ width:'28px', height:'28px', borderRadius:'10px', background:'rgba(22,163,74,0.12)', color:D.gtext, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, flexShrink:0 }}>Q</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'13px', fontWeight:800, color:D.sub, margin:'0 0 4px' }}>{q.author_name || '익명'}</p>
                        <p style={{ fontSize:'15px', color:D.text, lineHeight:1.7, whiteSpace:'pre-wrap', margin:0 }}>{q.question}</p>
                      </div>
                    </div>
                    {answered ? (
                      <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginTop:'14px', paddingTop:'14px', borderTop:`1px solid ${D.border}` }}>
                        <span style={{ width:'28px', height:'28px', borderRadius:'10px', background:'linear-gradient(135deg,#15803d,#16a34a)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, flexShrink:0 }}>A</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:'13px', fontWeight:900, color:D.gtext, margin:'0 0 4px' }}>온종일팜 답변</p>
                          <p style={{ fontSize:'15px', color:D.text, lineHeight:1.7, whiteSpace:'pre-wrap', margin:0 }}>{q.answer}</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize:'13px', color:D.sub, fontWeight:700, margin:'12px 0 0' }}>관리자가 확인 후 답변드릴게요.</p>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
