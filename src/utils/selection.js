export function saveSelection(sel) {
  try {
    sessionStorage.setItem('escher_selection', JSON.stringify(sel));
  } catch { }
}

export function loadSelection() {
  try {
    return JSON.parse(sessionStorage.getItem('escher_selection') || 'null');
  } catch {
    return null;
  }
}

export function clearSelection() {
  try {
    sessionStorage.removeItem('escher_selection');
  } catch { }
}
