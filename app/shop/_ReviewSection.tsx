'use client'

import React from 'react'
import Link from 'next/link'

// 상품 리뷰 섹션(작성/목록) — 상품상세 page에서 분리, 동작/디자인 동일
type Props = {
  reviews: any[]
  myReview: any
  reviewRating: number
  setReviewRating: (v: number) => void
  reviewContent: string
  setReviewContent: (v: string) => void
  reviewSubmitting: boolean
  submitReview: () => void
  deleteReview: () => void
  reviewImages: string[]
  setReviewImages: (v: string[] | ((prev: string[]) => string[])) => void
  reviewUploading: boolean
  uploadReviewImages: (e: any) => void
  reviewAvg: number
  D: any
  dark: boolean
  user: any
}

export function ReviewSection({ reviews, myReview, reviewRating, setReviewRating, reviewContent, setReviewContent, reviewSubmitting, submitReview, deleteReview, reviewImages, setReviewImages, reviewUploading, uploadReviewImages, reviewAvg, D, dark, user }: Props) {
  return (
        <div id="reviews" style={{background:D.card,borderRadius:'24px',padding:'28px',marginBottom:'16px',border:`1px solid ${D.border}`,scrollMarginTop:'80px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
            <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#15803d,#16a34a)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📝</div>
            <h2 style={{fontSize:'16px',fontWeight:900,letterSpacing:'-0.3px'}}>상품 리뷰</h2>
            {reviews.length > 0 && (
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'15px'}}>⭐</span>
                <span style={{fontSize:'15px',fontWeight:900,color:D.text}}>{reviewAvg.toFixed(1)}</span>
                <span style={{fontSize:'12px',color:D.sub}}>({reviews.length})</span>
              </div>
            )}
          </div>

          {/* 작성/수정 폼 */}
          {user ? (
            <div style={{background:dark?'#15391f':'#fdf2f8',borderRadius:'16px',padding:'18px',marginBottom:'20px',border:`1px solid ${dark?'rgba(255,255,255,0.06)':'#fce7f3'}`}}>
              <p style={{fontSize:'13px',fontWeight:800,color:D.text,margin:'0 0 10px'}}>{myReview ? '내 리뷰 수정' : '리뷰 작성하기'}</p>
              {/* 별점 선택 */}
              <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} aria-label={`별점 ${n}점`}
                    style={{background:'none',border:'none',cursor:'pointer',padding:0,fontSize:'26px',lineHeight:1,filter:n<=reviewRating?'none':'grayscale(1) opacity(0.3)',transition:'filter 0.15s'}}>⭐</button>
                ))}
                <span style={{alignSelf:'center',marginLeft:'6px',fontSize:'13px',fontWeight:800,color:D.gtext}}>{reviewRating}.0</span>
              </div>
              <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)}
                placeholder="상품은 어떠셨나요? 신선도, 맛, 포장 등 솔직한 후기를 남겨주세요 😊"
                rows={3} maxLength={500}
                style={{width:'100%',padding:'12px 14px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.card,color:D.text,fontSize:'13px',outline:'none',resize:'none',boxSizing:'border-box',lineHeight:1.6,fontFamily:'inherit'}} />

              {/* 사진 첨부 (최대 3장) */}
              <div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap',alignItems:'center'}}>
                {reviewImages.map((url,i)=>(
                  <div key={i} style={{position:'relative',width:'64px',height:'64px',borderRadius:'10px',overflow:'hidden',border:`1px solid ${D.border}`}}>
                    <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    <button onClick={()=>setReviewImages(prev=>prev.filter((_,x)=>x!==i))}
                      style={{position:'absolute',top:'2px',right:'2px',width:'18px',height:'18px',borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.6)',color:'white',fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>✕</button>
                  </div>
                ))}
                {reviewImages.length < 3 && (
                  <label style={{width:'64px',height:'64px',borderRadius:'10px',border:`2px dashed ${D.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:D.sub,fontSize:'11px',gap:'2px'}}>
                    <span style={{fontSize:'18px'}}>{reviewUploading?'⏳':'📷'}</span>
                    <span>{reviewUploading?'올리는중':'사진'}</span>
                    <input type="file" accept="image/*" multiple onChange={e=>uploadReviewImages(e.target.files)} style={{display:'none'}} disabled={reviewUploading} />
                  </label>
                )}
              </div>

              <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                <button onClick={submitReview} disabled={reviewSubmitting || !reviewContent.trim()}
                  style={{flex:1,padding:'12px',borderRadius:'12px',background:(reviewSubmitting||!reviewContent.trim())?D.input:'linear-gradient(135deg,#15803d,#16a34a)',color:(reviewSubmitting||!reviewContent.trim())?D.sub:'white',fontSize:'14px',fontWeight:900,border:'none',cursor:(reviewSubmitting||!reviewContent.trim())?'not-allowed':'pointer'}}>
                  {reviewSubmitting ? '저장 중...' : myReview ? '수정 완료' : '리뷰 등록'}
                </button>
                {myReview && (
                  <button onClick={deleteReview}
                    style={{padding:'12px 18px',borderRadius:'12px',background:'transparent',color:D.sub,fontSize:'13px',fontWeight:700,border:`1.5px solid ${D.border}`,cursor:'pointer'}}>삭제</button>
                )}
              </div>
            </div>
          ) : (
            <Link href="/shop/login" style={{display:'block',textAlign:'center',padding:'14px',background:D.input,color:D.sub,fontSize:'13px',fontWeight:600,borderRadius:'14px',textDecoration:'none',marginBottom:'20px'}}>
              로그인하고 리뷰 남기기 →
            </Link>
          )}

          {/* 리뷰 목록 */}
          {reviews.length === 0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:D.sub}}>
              <p style={{fontSize:'32px',margin:'0 0 8px'}}>🌱</p>
              <p style={{fontSize:'13px',fontWeight:600,margin:0}}>아직 리뷰가 없어요. 첫 리뷰를 남겨주세요!</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {reviews.map((r:any) => (
                <div key={r.id} style={{padding:'16px',background:dark?'#15391f':'#f8fafc',borderRadius:'14px',border:`1px solid ${r.user_id===user?.id?'#15803d':D.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#15803d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:900,flexShrink:0}}>
                      {(r.author_name||'익')[0]}
                    </div>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <p style={{fontSize:'13px',fontWeight:700,color:D.text,margin:0}}>{r.author_name||'익명'}</p>
                        {r.user_id===user?.id && <span style={{fontSize:'10px',fontWeight:700,color:D.gtext,background:'rgba(22,163,74,0.1)',padding:'1px 7px',borderRadius:'20px'}}>내 리뷰</span>}
                      </div>
                      <p style={{fontSize:'11px',color:D.sub,margin:0}}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}</p>
                    </div>
                    <div style={{marginLeft:'auto',fontSize:'12px',letterSpacing:'1px'}}>
                      {[1,2,3,4,5].map(n => <span key={n} style={{filter:n<=r.rating?'none':'grayscale(1) opacity(0.3)'}}>⭐</span>)}
                    </div>
                  </div>
                  {r.content && <p style={{fontSize:'13px',color:D.text,lineHeight:1.7,margin:0,whiteSpace:'pre-wrap'}}>{r.content}</p>}
                  {Array.isArray(r.image_urls) && r.image_urls.length > 0 && (
                    <div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>
                      {r.image_urls.map((url:string,i:number)=>(
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{display:'block',width:'72px',height:'72px',borderRadius:'10px',overflow:'hidden',border:`1px solid ${D.border}`}}>
                          <img src={url} alt="리뷰 사진" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
  )
}
