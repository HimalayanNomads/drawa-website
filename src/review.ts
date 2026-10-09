// The review section's file inspector. "Show more lines" opens the folded rows above the first hunk, as a hunk's
// header does in the app's Git and GitHub diffs, and a click on a name lists its references, as find references
// does. Without script the folded rows and the list both show.
const diff = document.querySelector<HTMLElement>('#rv-diff')!
const more = diff.querySelector<HTMLButtonElement>('.more')!
const folds = [...diff.querySelectorAll<HTMLElement>('.row.fold')]
const refs = diff.querySelector<HTMLElement>('#rv-refs')!
const syms = [...diff.querySelectorAll<HTMLButtonElement>('.sym')]

for (const r of folds) r.hidden = true
more.onclick = () => {
  for (const r of folds) r.hidden = false
  more.setAttribute('aria-expanded', 'true')
  more.hidden = true
  folds[0].tabIndex = -1
  folds[0].focus({ preventScroll: true })
}

refs.hidden = true
for (const s of syms) {
  s.onclick = () => {
    const open = refs.hidden
    refs.hidden = !open
    for (const o of syms) o.setAttribute('aria-expanded', String(open))
  }
}
diff.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || refs.hidden) return
  refs.hidden = true
  for (const o of syms) o.setAttribute('aria-expanded', 'false')
  syms[0].focus()
})

for (const t of document.querySelectorAll<HTMLElement>('.try')) t.hidden = false
diff.classList.add('ready')
