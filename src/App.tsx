import { Link, NavLink, Outlet } from 'react-router-dom';
import { SLOT_TABLES } from './slotTables';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          OSRS Slot Tables
        </Link>
        <nav className="top-nav">
          {SLOT_TABLES.map((t) => (
            <NavLink
              key={t.slug}
              to={`/${t.slug}`}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {t.shortName}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        Data is fetched live from the{' '}
        <a href="https://oldschool.runescape.wiki/w/Category:Slot_tables" target="_blank" rel="noreferrer">
          OSRS Wiki
        </a>{' '}
        via its public API. Content is licensed under{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank" rel="noreferrer">
          CC BY-NC-SA 3.0
        </a>
        .
      </footer>
    </div>
  );
}
