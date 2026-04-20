'use client'

import { useState, useEffect, useRef } from 'react'
import { ICONS, ICON_CATEGORIES, type IconCategory, type IconItem, makeIconHtml } from '../lib/editor-icons'

type Props = {
  containerSelector?: string  // 편집 영역 셀렉터 (기본: '#landing-preview')
  primaryColor?: string       // 강조 색상
}

// 색상 팔레트 (프리셋과 매칭)
const COLOR_PALETTE = [
  { name: '본문', value: 'inherit' },
  { name: '먹', value: '#1C1610' },
  { name: '회색', value: '#666666' },
  { name: '앰버', value: '#C8842D' },
  { name: '딥앰버', value: '#8B4513' },
  { name: '그린', value: '#4A7C4E' },
  { name: '딥그린', value: '#2D5A3D' },
  { name: '레드', value: '#8B1A1A' },
  { name: '네이비', value: '#1E3A5F' },
  { name: '화이트', value: '#FFFFFF' },
]

// 글자 크기
const FONT_SIZES = [
  { name: '작게', value: '12px' },
  { name: '보통', value: '15px' },
  { name: '중간', value: '18px' },
  { name: '크게', value: '24px' },
  { name: '매우 크게', value: '32px' },
  { name: '제목', value: '40px' },
]

// 폰트
const FONT_FAMILIES = [
  { name: '본문체', value: 'inherit' },
  { name: '명조', value: "'Noto Serif KR', serif" },
  { name: '바탕', value: "'Gowun Batang', serif" },
  { name: '고딕', value: "'Pretendard Variable', sans-serif" },
]

export default function EditorToolbar({ containerSelector = '#landing-preview', primaryColor = '#C8842D' }: Props) {
  // 플로팅 툴바 상태
  const [floating, setFloating] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })
  const [activeMenu, setActiveMenu] = useState<'color' | 'size' | 'font' | null>(null)
  // 사이드 아이콘 패널
  const [sidePanel, setSidePanel] = useState<boolean>(false)
  const [iconCategory, setIconCategory] = useState<IconCategory>('arrow')
  const [iconColor, setIconColor] = useState<string>(primaryColor)
  const [iconSize, setIconSize] = useState<number>(24)
  // 마지막 selection 저장 (메뉴 클릭 시 selection 사라지는 거 방지)
  const savedRange = useRef<Range | null>(null)
  const lastTarget = useRef<HTMLElement | null>(null)

  // 텍스트 선택 감지 → 플로팅 툴바 표시
  useEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const handleSelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        setFloating(f => ({ ...f, show: false }))
        return
      }
      const range = sel.getRangeAt(0)
      // 선택이 컨테이너 안에 있는지 확인
      if (!container.contains(range.commonAncestorContainer)) {
        setFloating(f => ({ ...f, show: false }))
        return
      }
      // 선택된 영역이 있어야 표시 (커서만 있으면 숨김)
      if (sel.isCollapsed) {
        setFloating(f => ({ ...f, show: false }))
        return
      }
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      savedRange.current = range.cloneRange()
      const ce = (range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer) as HTMLElement
      lastTarget.current = ce?.closest('[contenteditable="true"]') as HTMLElement

      setFloating({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        show: true,
      })
      setActiveMenu(null)
    }

    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [containerSelector])

  // selection 복원
  const restoreSelection = () => {
    if (!savedRange.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(savedRange.current)
  }

  // 텍스트 스타일 적용 (selection에)
  const applyStyle = (style: string, value: string) => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.style.setProperty(style, value)
    try {
      // 선택 영역을 span으로 감싸기
      const content = range.extractContents()
      span.appendChild(content)
      range.insertNode(span)
      // selection 갱신
      sel.removeAllRanges()
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      sel.addRange(newRange)
      savedRange.current = newRange.cloneRange()
    } catch (e) {
      console.warn('style apply failed', e)
    }
    // 변경 알림 (contenteditable이 onInput 트리거)
    if (lastTarget.current) {
      lastTarget.current.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  // 굵게 / 기울임 / 밑줄 (execCommand 사용 - 가장 안정적)
  const execCmd = (cmd: string) => {
    restoreSelection()
    document.execCommand(cmd, false)
    if (lastTarget.current) {
      lastTarget.current.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  // 아이콘 삽입 (커서 위치에)
  const insertIcon = (icon: IconItem) => {
    // 마지막 포커스 영역에 삽입
    let target = lastTarget.current
    if (!target) {
      // 포커스된 contenteditable 찾기
      const focused = document.activeElement as HTMLElement
      if (focused && focused.getAttribute('contenteditable') === 'true') {
        target = focused
      }
    }
    if (!target) {
      // 컨테이너 내 첫 번째 contenteditable에 삽입
      const container = document.querySelector(containerSelector)
      target = container?.querySelector('[contenteditable="true"]') as HTMLElement
    }
    if (!target) {
      alert('편집할 텍스트 영역을 먼저 클릭하세요.')
      return
    }

    target.focus()
    const html = makeIconHtml(icon, iconColor, iconSize)

    // 현재 selection이 있으면 거기에, 없으면 마지막에 삽입
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && target.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      const node = tempDiv.firstChild
      if (node) {
        range.insertNode(node)
        // 커서를 아이콘 뒤로
        range.setStartAfter(node)
        range.setEndAfter(node)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    } else {
      target.insertAdjacentHTML('beforeend', html)
    }

    target.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return (
    <>
      {/* 플로팅 텍스트 툴바 */}
      {floating.show && (
        <div
          style={{
            position: 'fixed',
            left: floating.x,
            top: floating.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            background: '#1a1a1a',
            border: '1px solid #c8a96e44',
            borderRadius: '10px',
            padding: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            gap: '2px',
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {/* 굵게 */}
          <button onClick={() => execCmd('bold')} title="굵게"
            style={btnStyle()}>
            <strong>B</strong>
          </button>
          {/* 기울임 */}
          <button onClick={() => execCmd('italic')} title="기울임"
            style={btnStyle()}>
            <em>I</em>
          </button>
          {/* 밑줄 */}
          <button onClick={() => execCmd('underline')} title="밑줄"
            style={btnStyle()}>
            <u>U</u>
          </button>

          <Sep />

          {/* 글자 크기 */}
          <button onClick={() => setActiveMenu(activeMenu === 'size' ? null : 'size')} title="글자 크기"
            style={btnStyle(activeMenu === 'size')}>
            <span style={{ fontSize: '11px' }}>크기</span>
          </button>
          {/* 폰트 */}
          <button onClick={() => setActiveMenu(activeMenu === 'font' ? null : 'font')} title="글꼴"
            style={btnStyle(activeMenu === 'font')}>
            <span style={{ fontSize: '11px' }}>글꼴</span>
          </button>
          {/* 색상 */}
          <button onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')} title="색상"
            style={btnStyle(activeMenu === 'color')}>
            <span style={{
              display: 'inline-block', width: '12px', height: '12px',
              background: 'linear-gradient(135deg,#c8a96e,#8b4513)', borderRadius: '50%',
            }} />
          </button>

          <Sep />

          {/* 정렬 */}
          <button onClick={() => execCmd('justifyLeft')} title="왼쪽 정렬" style={btnStyle()}>≡</button>
          <button onClick={() => execCmd('justifyCenter')} title="가운데 정렬" style={btnStyle()}>☰</button>
          <button onClick={() => execCmd('justifyRight')} title="오른쪽 정렬" style={btnStyle()}>≣</button>

          {/* 서브메뉴: 색상 */}
          {activeMenu === 'color' && (
            <Submenu>
              <SubmenuTitle>글자 색상</SubmenuTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' }}>
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { applyStyle('color', c.value); setActiveMenu(null) }}
                    title={c.name}
                    style={{
                      width: '28px', height: '28px',
                      background: c.value === 'inherit' ? 'transparent' : c.value,
                      border: c.value === '#FFFFFF' ? '1px solid #555' : 'none',
                      borderRadius: '6px', cursor: 'pointer',
                      color: c.value === 'inherit' ? 'white' : 'transparent',
                      fontSize: '12px',
                    }}
                  >{c.value === 'inherit' ? '✕' : ''}</button>
                ))}
              </div>
              <SubmenuTitle>배경 강조</SubmenuTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' }}>
                {COLOR_PALETTE.slice(0, 6).map(c => (
                  <button
                    key={c.value + '-bg'}
                    onClick={() => { applyStyle('background-color', c.value + (c.value.startsWith('#') ? '33' : '')); setActiveMenu(null) }}
                    style={{
                      height: '20px',
                      background: c.value === 'inherit' ? 'transparent' : c.value + '44',
                      border: '1px solid #555',
                      borderRadius: '4px', cursor: 'pointer',
                    }} />
                ))}
              </div>
            </Submenu>
          )}

          {/* 서브메뉴: 크기 */}
          {activeMenu === 'size' && (
            <Submenu>
              <SubmenuTitle>글자 크기</SubmenuTitle>
              {FONT_SIZES.map(s => (
                <button key={s.value} onClick={() => { applyStyle('font-size', s.value); setActiveMenu(null) }}
                  style={subBtnStyle()}>
                  <span>{s.name}</span>
                  <span style={{ fontSize: s.value, color: '#aaa', maxHeight: '24px', lineHeight: 1, overflow: 'hidden' }}>가</span>
                </button>
              ))}
            </Submenu>
          )}

          {/* 서브메뉴: 폰트 */}
          {activeMenu === 'font' && (
            <Submenu>
              <SubmenuTitle>글꼴</SubmenuTitle>
              {FONT_FAMILIES.map(f => (
                <button key={f.value} onClick={() => { applyStyle('font-family', f.value); setActiveMenu(null) }}
                  style={subBtnStyle()}>
                  <span>{f.name}</span>
                  <span style={{ fontFamily: f.value, color: '#aaa' }}>가나다</span>
                </button>
              ))}
            </Submenu>
          )}
        </div>
      )}

      {/* 사이드 아이콘 패널 토글 버튼 */}
      <button
        onClick={() => setSidePanel(v => !v)}
        style={{
          position: 'fixed',
          right: sidePanel ? '320px' : '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 99999,
          width: '44px',
          height: '90px',
          background: 'linear-gradient(135deg,#c8a96e,#8b4513)',
          color: '#fff',
          border: 'none',
          borderRadius: sidePanel ? '12px 0 0 12px' : '12px 0 0 12px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '2px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.3)',
          transition: 'right 0.2s',
        }}
      >
        {sidePanel ? '닫기 ›' : '‹ 요소'}
      </button>

      {/* 사이드 아이콘 패널 */}
      {sidePanel && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '320px',
            background: '#1a1a1a',
            color: 'white',
            zIndex: 99998,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 헤더 */}
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #333' }}>
            <p style={{
              fontSize: '11px', letterSpacing: '0.3em', color: '#c8a96e',
              margin: '0 0 6px', textTransform: 'uppercase', fontFamily: "'Noto Serif KR', serif",
            }}>ELEMENTS</p>
            <h3 style={{ fontSize: '17px', margin: 0, fontWeight: 700 }}>요소 추가</h3>
            <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
              텍스트 영역 클릭 후 아이콘을 누르세요
            </p>
          </div>

          {/* 색상/크기 컨트롤 */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px' }}>색상</p>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['#1C1610', '#666666', '#C8842D', '#8B4513', '#4A7C4E', '#1E3A5F', '#8B1A1A'].map(c => (
                  <button key={c} onClick={() => setIconColor(c)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: c,
                      border: iconColor === c ? '2px solid #c8a96e' : '1px solid #333',
                      cursor: 'pointer', padding: 0,
                    }} />
                ))}
              </div>
            </div>
            <div style={{ width: '90px' }}>
              <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px' }}>크기 {iconSize}px</p>
              <input type="range" min="14" max="80" value={iconSize}
                onChange={e => setIconSize(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div style={{ padding: '12px 16px 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {ICON_CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setIconCategory(cat.key)}
                style={{
                  padding: '5px 10px',
                  background: iconCategory === cat.key ? '#c8a96e' : 'transparent',
                  color: iconCategory === cat.key ? '#111' : '#aaa',
                  border: '1px solid ' + (iconCategory === cat.key ? '#c8a96e' : '#333'),
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* 카테고리 설명 */}
          <p style={{ fontSize: '10px', color: '#666', margin: '8px 16px 0' }}>
            {ICON_CATEGORIES.find(c => c.key === iconCategory)?.desc}
          </p>

          {/* 아이콘 그리드 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
              {ICONS.filter(i => i.category === iconCategory).map(icon => (
                <button key={icon.key} onClick={() => insertIcon(icon)}
                  title={icon.name}
                  style={{
                    aspectRatio: '1',
                    background: '#252525',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: iconColor,
                    transition: 'all 0.15s',
                    padding: '8px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a96e'; e.currentTarget.style.background = '#2a2520' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#252525' }}
                  dangerouslySetInnerHTML={{
                    __html: icon.svg.replace('<svg ', `<svg style="width:24px;height:24px;color:inherit;" `),
                  }} />
              ))}
            </div>

            {/* 사용법 안내 */}
            <div style={{ marginTop: '24px', padding: '12px', background: '#0e0e0e', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
              <p style={{ fontSize: '11px', color: '#c8a96e', margin: '0 0 6px', fontWeight: 700 }}>💡 사용 방법</p>
              <p style={{ fontSize: '11px', color: '#888', margin: 0, lineHeight: 1.7 }}>
                1. 미리보기에서 텍스트 영역 클릭<br />
                2. 원하는 위치에 커서 두기<br />
                3. 아이콘 클릭하면 삽입됨<br />
                4. 텍스트 드래그하면 상단에 스타일 툴바 뜸
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============ 스타일 헬퍼 ============

function btnStyle(active = false): React.CSSProperties {
  return {
    width: '32px',
    height: '32px',
    background: active ? '#c8a96e' : 'transparent',
    color: active ? '#111' : 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Noto Serif KR', serif",
    transition: 'all 0.15s',
  }
}

function subBtnStyle(): React.CSSProperties {
  return {
    display: 'flex',
    width: '100%',
    padding: '6px 10px',
    background: 'transparent',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    textAlign: 'left',
  }
}

function Sep() {
  return <div style={{ width: '1px', height: '20px', background: '#333', margin: '0 2px' }} />
}

function Submenu({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)',
      background: '#1a1a1a',
      border: '1px solid #c8a96e44',
      borderRadius: '10px',
      padding: '12px',
      minWidth: '200px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      {children}
    </div>
  )
}

function SubmenuTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '10px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase',
      letterSpacing: '0.15em', fontWeight: 700,
    }}>{children}</p>
  )
}
