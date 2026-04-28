import { useMemo, useState } from 'react';
import type { ParsedColumn, ParsedRow, ParsedTable } from '../wiki';

interface Props {
  table: ParsedTable;
  /** Initial set of column keys to include in the sum column. */
  initialSumKeys: string[];
}

type SortKey = string | '__sum__';

interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}

const SUM_KEY: SortKey = '__sum__';

function rowSum(row: ParsedRow, keys: string[]): number {
  let s = 0;
  for (const k of keys) {
    const v = row.num[k];
    if (Number.isFinite(v)) s += v;
  }
  return s;
}

function compareCells(a: ParsedRow, b: ParsedRow, col: ParsedColumn): number {
  if (col.numeric) {
    const av = a.num[col.key];
    const bv = b.num[col.key];
    const aFinite = Number.isFinite(av);
    const bFinite = Number.isFinite(bv);
    if (!aFinite && !bFinite) return 0;
    if (!aFinite) return 1;
    if (!bFinite) return -1;
    return av - bv;
  }
  return (a.text[col.key] ?? '').localeCompare(b.text[col.key] ?? '', undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export default function SortableSlotTable({ table, initialSumKeys }: Props) {
  const numericColumns = useMemo(() => table.columns.filter((c) => c.numeric), [table.columns]);

  const validInitialKeys = useMemo(() => {
    const numericKeySet = new Set(numericColumns.map((c) => c.key));
    return initialSumKeys.filter((k) => numericKeySet.has(k));
  }, [initialSumKeys, numericColumns]);

  const [sumKeys, setSumKeys] = useState<string[]>(validInitialKeys);
  const [sort, setSort] = useState<SortState>({ key: SUM_KEY, dir: 'desc' });

  const sortedRows = useMemo(() => {
    const rows = [...table.rows];
    if (sort.key === SUM_KEY) {
      rows.sort((a, b) => {
        const diff = rowSum(a, sumKeys) - rowSum(b, sumKeys);
        return sort.dir === 'asc' ? diff : -diff;
      });
    } else {
      const col = table.columns.find((c) => c.key === sort.key);
      if (col) {
        rows.sort((a, b) => {
          const diff = compareCells(a, b, col);
          return sort.dir === 'asc' ? diff : -diff;
        });
      }
    }
    return rows;
  }, [table.rows, table.columns, sort, sumKeys]);

  const onHeaderClick = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, dir: 'desc' };
      }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  const toggleSumKey = (key: string) => {
    setSumKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const sumLabel = sumKeys.length === 0 ? 'Σ (pick columns)' : `Σ ${sumKeys.length}`;

  return (
    <div className="slot-table-wrap">
      <fieldset className="sum-picker">
        <legend>Columns to sum</legend>
        <div className="sum-picker-grid">
          {numericColumns.map((col) => {
            const checked = sumKeys.includes(col.key);
            return (
              <label key={col.key} className={checked ? 'sum-chip checked' : 'sum-chip'}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSumKey(col.key)}
                />
                <span>
                  {col.group && col.group !== col.label ? (
                    <>
                      <span className="sum-chip-group">{col.group}</span>{' '}
                    </>
                  ) : null}
                  {col.label}
                </span>
              </label>
            );
          })}
        </div>
        <div className="sum-picker-actions">
          <button type="button" onClick={() => setSumKeys(numericColumns.map((c) => c.key))}>
            Select all
          </button>
          <button type="button" onClick={() => setSumKeys([])}>
            Clear
          </button>
          <button type="button" onClick={() => setSumKeys(validInitialKeys)}>
            Reset to default
          </button>
        </div>
      </fieldset>

      <div className="table-scroll">
        <table className="wiki-mirror">
          <thead>
            <tr className="group-row">
              {table.columns.map((col, i) => {
                const prev = table.columns[i - 1];
                const isStartOfGroup = !prev || prev.group !== col.group;
                if (!isStartOfGroup) return null;
                let span = 1;
                for (let j = i + 1; j < table.columns.length; j += 1) {
                  if (table.columns[j].group === col.group) span += 1;
                  else break;
                }
                return (
                  <th key={`group-${i}`} colSpan={span} className="group-header">
                    {col.group ?? ''}
                  </th>
                );
              })}
              <th rowSpan={2} className="sum-col-header" onClick={() => onHeaderClick(SUM_KEY)}>
                <button type="button" className="sort-button">
                  {sumLabel}
                  {sort.key === SUM_KEY ? (
                    <span className="sort-arrow">{sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>
                  ) : (
                    <span className="sort-arrow muted"> ↕</span>
                  )}
                </button>
              </th>
            </tr>
            <tr>
              {table.columns.map((col) => {
                const active = sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={sumKeys.includes(col.key) ? 'leaf-header in-sum' : 'leaf-header'}
                    onClick={() => onHeaderClick(col.key)}
                  >
                    <button type="button" className="sort-button">
                      {col.label}
                      {active ? (
                        <span className="sort-arrow">{sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>
                      ) : (
                        <span className="sort-arrow muted"> ↕</span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, ri) => (
              <tr key={ri}>
                {table.columns.map((col) => (
                  <td
                    key={col.key}
                    className={sumKeys.includes(col.key) ? 'in-sum' : undefined}
                    dangerouslySetInnerHTML={{ __html: row.html[col.key] ?? '' }}
                  />
                ))}
                <td className="sum-cell">{rowSum(row, sumKeys)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedRows.length === 0 ? <p className="empty">No rows in this table.</p> : null}
    </div>
  );
}
