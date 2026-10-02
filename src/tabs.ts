// A window split into folder tabs, one per panel: the tour, the shortcuts and the reference. Each [data-tabs]
// box holds a [role=tablist] and the panels its tabs control. Arrows, Home and End move between tabs, as in
// the app's tab rows. Without script the tab row stays hidden and every panel shows, stacked.
for (const box of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
  const tabs = [...box.querySelectorAll<HTMLButtonElement>('[role=tab]')]
  const panel = (t: HTMLButtonElement) => document.getElementById(t.getAttribute('aria-controls')!)!

  function show(t: HTMLButtonElement, focus = false) {
    for (const o of tabs) {
      const on = o === t
      o.setAttribute('aria-selected', String(on))
      o.tabIndex = on ? 0 : -1
      panel(o).hidden = !on
    }
    if (focus) t.focus()
    // keep the tab in view when the row scrolls sideways on a phone (the row is the tabs' offsetParent)
    const row = t.parentElement!
    if (t.offsetLeft < row.scrollLeft || t.offsetLeft + t.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = t.offsetLeft - 24
  }

  for (const [i, t] of tabs.entries()) {
    t.onclick = () => show(t)
    t.onkeydown = e => {
      const to = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key]
      if (to === undefined) return
      e.preventDefault()
      show(tabs[(to + tabs.length) % tabs.length], true)
    }
  }
  const first = tabs.find(t => t.getAttribute('aria-selected') === 'true') ?? tabs[0]
  for (const o of tabs) { o.tabIndex = o === first ? 0 : -1; panel(o).hidden = o !== first }
  box.classList.add('ready')
}
