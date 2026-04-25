import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
  lockScroll?: boolean;
}

let lockCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  lockCount += 1;

  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
    }
  };
}

export default function ModalPortal({ children, lockScroll = true }: ModalPortalProps) {
  useEffect(() => {
    if (!lockScroll) return undefined;
    return lockBodyScroll();
  }, [lockScroll]);

  if (typeof document === 'undefined') return <>{children}</>;

  return createPortal(children, document.body);
}
