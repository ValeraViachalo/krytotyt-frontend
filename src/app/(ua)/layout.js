import PageTransition from '@/utils/PageTransition/PageTransition'
import UIProvider from '@/utils/UIProvider/UIProvider'

export default function layout({ children }) {
  return (
    <UIProvider>
      <PageTransition>
        {children}
      </PageTransition>
    </UIProvider>
  )
}
