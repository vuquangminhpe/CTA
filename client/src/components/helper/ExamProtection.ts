/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect } from 'react'

/**
 * Helper to apply protection to an exam page
 * @param enabled - Whether protection is active
 * @param userData - Optional user data to embed in watermarks
 */
export const useExamProtection = (enabled: boolean = true, userData?: { name?: string; id?: string }) => {
  useEffect(() => {
    if (!enabled) return

    // Add protection class to body
    document.body.classList.add('exam-protected')

    // Disable certain browser features that can be used for screen capturing
    const originalSendBeacon = navigator.sendBeacon
    const originalExecCommand = document.execCommand

    // Override sendBeacon as it can be used by some screen capture tools
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    navigator.sendBeacon = function (...args) {
      console.warn('Attempt to use sendBeacon blocked for exam security')
      return false
    }

    // Disable execCommand which can be used for copying content
    document.execCommand = function (command) {
      if (command === 'copy' || command === 'cut' || command === 'paste') {
        console.warn(`Document execCommand "${command}" blocked for exam security`)
        return false
      }
      return originalExecCommand.apply(this, arguments as any)
    }

    // Block data URI navigation (could be used to extract screen data)
    const originalOpen = window.open
    window.open = function (url, ...args) {
      if (typeof url === 'string' && url.startsWith('data:')) {
        console.warn('Attempt to open data URI blocked for exam security')
        return null
      }
      // @ts-ignore
      return originalOpen.apply(this, arguments)
    }

    // Disable browser devtools keyboard shortcuts
    const blockDevTools = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault()
        console.warn('Developer tools shortcut blocked for exam security')
      }
    }

    window.addEventListener('keydown', blockDevTools, true)

    // Detect if DevTools is open via console.log timing differences
    let devToolsOpened = false
    const checkDevTools = () => {
      const startTime = performance.now()
      console.log('%c', 'font-size:0;')
      const endTime = performance.now()

      // If console is open, the time difference will be significant
      if (endTime - startTime > 100 && !devToolsOpened) {
        devToolsOpened = true
        console.warn('Developer console detected! This may be considered an exam violation.')

        // Create warning element
        const warning = document.createElement('div')
        warning.innerText = 'WARNING: Developer console detected! This is considered an exam violation.'
        warning.style.position = 'fixed'
        warning.style.top = '0'
        warning.style.left = '0'
        warning.style.width = '100%'
        warning.style.padding = '10px'
        warning.style.backgroundColor = 'red'
        warning.style.color = 'white'
        warning.style.fontWeight = 'bold'
        warning.style.textAlign = 'center'
        warning.style.zIndex = '9999'

        document.body.appendChild(warning)
      }
    }

    const devToolsCheckInterval = setInterval(checkDevTools, 1000)

    // Clean up function
    return () => {
      document.body.classList.remove('exam-protected')
      navigator.sendBeacon = originalSendBeacon
      document.execCommand = originalExecCommand
      window.open = originalOpen
      window.removeEventListener('keydown', blockDevTools, true)
      clearInterval(devToolsCheckInterval)
    }
  }, [enabled, userData])
}

export default useExamProtection
