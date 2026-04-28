import { useEffect, useState } from 'react';
import SortableSlotTable from '../components/SortableSlotTable';
import type { SlotTableDef } from '../slotTables';
import { fetchWikiPageHtml, parseWikiTable, type ParsedTable } from '../wiki';

interface Props {
  table: SlotTableDef;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ParsedTable };

function resolveSumKeys(parsed: ParsedTable, defaults: string[]): string[] {
  // Defaults are bottom-most labels (e.g. "Stab", "Slash"). The actual column
  // keys may be qualified with a group (e.g. "Defence bonuses - Stab"). Match
  // by either exact key or by label, preferring keys whose group mentions
  // "defence" so e.g. "Stab" defaults to defensive Stab.
  const out: string[] = [];
  for (const def of defaults) {
    const exact = parsed.columns.find((c) => c.numeric && c.key === def);
    if (exact) {
      out.push(exact.key);
      continue;
    }
    const matchesByLabel = parsed.columns.filter(
      (c) => c.numeric && c.label.toLowerCase() === def.toLowerCase(),
    );
    if (matchesByLabel.length === 0) continue;
    const defensive = matchesByLabel.find((c) =>
      (c.group ?? '').toLowerCase().includes('defen'),
    );
    out.push((defensive ?? matchesByLabel[0]).key);
  }
  return out;
}

export default function SlotTablePage({ table }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const html = await fetchWikiPageHtml(table.wikiPage);
        const parsed = parseWikiTable(html);
        if (!cancelled) setState({ status: 'ready', data: parsed });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [table.wikiPage]);

  return (
    <article className="slot-page">
      <header className="slot-page-header">
        <h1>{table.title}</h1>
        <p className="slot-page-source">
          Mirrored from{' '}
          <a
            href={`https://oldschool.runescape.wiki/w/${table.wikiPage}`}
            target="_blank"
            rel="noreferrer"
          >
            oldschool.runescape.wiki/w/{table.wikiPage}
          </a>
          . Click any column header to sort. Pick numeric columns to add into the
          rightmost <code>Σ</code> column, then sort the table by it.
        </p>
      </header>

      {state.status === 'loading' ? <p className="loading">Loading from the OSRS Wiki…</p> : null}
      {state.status === 'error' ? (
        <div className="error-box">
          <strong>Failed to load:</strong> {state.message}
        </div>
      ) : null}
      {state.status === 'ready' ? (
        <SortableSlotTable
          table={state.data}
          initialSumKeys={resolveSumKeys(state.data, table.defaultSumColumns)}
        />
      ) : null}
    </article>
  );
}
