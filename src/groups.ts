// The groups section's frames fold to their tab and open again, as M does to a group in the app. A folded
// frame's tab keeps its window count; the button's label says which way it goes next.
for (const btn of document.querySelectorAll<HTMLButtonElement>('.grp .grp-fold')) {
  const grp = btn.closest<HTMLElement>('.grp')!
  const body = document.getElementById(btn.getAttribute('aria-controls')!)!
  const name = grp.querySelector('.win-h .t')!.textContent
  btn.onclick = () => {
    const open = body.hidden
    body.hidden = !open
    grp.classList.toggle('min', !open)
    btn.setAttribute('aria-expanded', String(open))
    btn.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} the ${name} group`)
  }
}
