// Full view for the tour's screenshots, as clicking a picture does in the app: the shot the current theme
// shows fills the screen in a dialog. A click anywhere or Esc closes it.
const full = document.querySelector<HTMLDialogElement>('#full')!
const big = full.querySelector('img')!

for (const frame of document.querySelectorAll<HTMLButtonElement>('.shot-frame')) {
  frame.onclick = () => {
    const shot = [...frame.querySelectorAll('img')].find(i => i.offsetParent !== null)
    if (!shot) return
    big.src = shot.currentSrc || shot.src
    big.alt = shot.alt
    full.showModal()
  }
}
full.onclick = () => full.close()
full.onclose = () => big.removeAttribute('src')
