const KEY = "gsh_history_v1";

export interface SavedQuery {
  id: string;
  label: string;
  query: string;
  createdAt: number;
}

export function loadHistory(): SavedQuery[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedQuery[];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: SavedQuery) {
  const current = loadHistory();
  const next = [entry, ...current].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function removeFromHistory(id: string) {
  const current = loadHistory();
  const next = current.filter(e => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}




