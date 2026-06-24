export function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existing = document.getElementById('google-script')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'google-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function initializeGoogleAuth(onCredentialResponse) {
  if (!window.google?.accounts?.id) return

  window.google.accounts.id.initialize({
    client_id: 'your_google_client_id_here',
    callback: onCredentialResponse,
  })

  window.google.accounts.id.renderButton(document.getElementById('google-login-button'), {
    theme: 'outline',
    size: 'large',
    width: 280,
  })
}
