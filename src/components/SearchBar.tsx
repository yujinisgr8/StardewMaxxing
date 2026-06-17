import { useMemo, useState } from 'react';
import { ITEMS } from '../data/items';
import { Item } from '../engine/types';
import { useI18n } from '../i18n';
import { ItemIcon } from './ItemIcon';

const norm = (s: string) => s.toLowerCase().trim();

export function SearchBar({ onPick }: { onPick: (item: Item) => void }) {
  const { t, name } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return ITEMS.filter((i) => norm(i.nameEn).includes(q) || i.nameZh.includes(query.trim())).slice(0, 8);
  }, [query]);

  const pick = (item: Item) => {
    onPick(item);
    setQuery(name(item));
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        className="sv-input w-full text-lg"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) pick(matches[0]);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && query && (
        <div className="sv-panel absolute z-10 mt-1 w-full max-h-72 overflow-auto p-1">
          {matches.length === 0 ? (
            <div className="px-2 py-2 text-ink-soft">{t.noResults}</div>
          ) : (
            matches.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-parchment-dark text-left"
                onClick={() => pick(item)}
              >
                <ItemIcon id={item.id} category={item.category} size={22} />
                <span className="flex-1">{name(item)}</span>
                <span className="text-ink-soft text-sm">
                  {item.nameEn} · {item.nameZh}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
