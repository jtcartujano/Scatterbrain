import { ReactNode } from 'react';

interface MainLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  rightPanel?: ReactNode;
}

export function MainLayout({ sidebar, main, rightPanel }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-void)' }}>
      {/* Left Sidebar */}
      <aside className="w-[272px] flex-shrink-0" style={{ backgroundColor: 'var(--color-surface)' }}>
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {main}
      </main>

      {/* Right Panel (Optional) */}
      {rightPanel && (
        <aside className="w-[264px] flex-shrink-0" style={{ backgroundColor: 'var(--color-surface)' }}>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
