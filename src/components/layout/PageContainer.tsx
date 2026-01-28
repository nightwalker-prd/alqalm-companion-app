import { type ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  noBottomPadding?: boolean;
  /** Enable flex column layout for the container */
  flexColumn?: boolean;
}

export function PageContainer({
  children,
  className = '',
  noPadding = false,
  noBottomPadding = false,
  flexColumn = false,
}: PageContainerProps) {
  return (
    <main
      className={`
        min-h-screen
        ${noPadding ? '' : 'px-4 py-6'}
        ${noBottomPadding ? '' : 'pb-24'}
        ${flexColumn ? 'flex flex-col' : ''}
        ${className}
      `}
    >
      <div className={`max-w-2xl mx-auto ${flexColumn ? 'flex-1 flex flex-col w-full' : ''}`}>
        {children}
      </div>
    </main>
  );
}

export default PageContainer;
