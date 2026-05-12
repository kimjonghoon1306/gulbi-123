'use client'

import { createContext, useContext } from 'react'

export type SupplierTheme = {
  isDark: boolean
  bg: string
  card: string
  border: string
  text: string
  textMuted: string
  textFaint: string
  input: string
  inputBorder: string
  optionBg: string
}

export const darkTheme: SupplierTheme = {
  isDark: true,
  bg:         '#0d1117',
  card:       '#161b22',
  border:     'rgba(255,255,255,0.06)',
  text:       'white',
  textMuted:  'rgba(255,255,255,0.4)',
  textFaint:  'rgba(255,255,255,0.25)',
  input:      'rgba(255,255,255,0.05)',
  inputBorder:'rgba(255,255,255,0.1)',
  optionBg:   '#1e2530',
}

export const lightTheme: SupplierTheme = {
  isDark: false,
  bg:         '#f4f6f9',
  card:       '#ffffff',
  border:     'rgba(0,0,0,0.08)',
  text:       '#1a1a2e',
  textMuted:  'rgba(0,0,0,0.45)',
  textFaint:  'rgba(0,0,0,0.25)',
  input:      'rgba(0,0,0,0.04)',
  inputBorder:'rgba(0,0,0,0.12)',
  optionBg:   '#ffffff',
}

export const ThemeContext = createContext<SupplierTheme>(darkTheme)

export function useSupplierTheme() {
  return useContext(ThemeContext)
}
