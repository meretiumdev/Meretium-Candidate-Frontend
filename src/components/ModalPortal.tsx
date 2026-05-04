import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
  lockScroll?: boolean;
}

export default function ModalPortal({ children, lockScroll = true }: ModalPortalProps) {
  useEffect(() => {
    if (!lockScroll || typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lockScroll]);

  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
