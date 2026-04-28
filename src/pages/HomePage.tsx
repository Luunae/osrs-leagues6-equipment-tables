import { Link } from 'react-router-dom';
import { SLOT_TABLES } from '../slotTables';

export default function HomePage() {
  return (
    <div className="home">
      <h1>OSRS Slot Tables, with summable columns</h1>
      <p>
        Each page below mirrors an OSRS Wiki slot table and adds a configurable
        <code> Σ </code> column. Pick which numeric columns to add together
        (e.g. <em>Stab defence + Slash defence + Crush defence</em>), then sort
        the table by the sum to find the items with the highest combined value.
      </p>
      <p className="excluded-note">
        F2P, combat-only pure, and Ultimate Ironman variants from{' '}
        <a href="https://oldschool.runescape.wiki/w/Category:Slot_tables" target="_blank" rel="noreferrer">
          Category:Slot tables
        </a>{' '}
        are intentionally omitted.
      </p>
      <ul className="slot-table-list">
        {SLOT_TABLES.map((t) => (
          <li key={t.slug}>
            <Link to={`/${t.slug}`}>{t.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
