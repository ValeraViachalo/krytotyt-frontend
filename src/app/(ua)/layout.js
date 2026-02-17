import UIProvider from '@/utils/UIProvider/UIProvider'
import React from 'react'

export default function layout({ children }) {
  return (
    <UIProvider>
      {children}
    </UIProvider>
  )
}
