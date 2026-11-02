'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
}

const PHONE = '(max-width: 639px)';
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useIsPhone = () => useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => false);

const Check = () => (
  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Branded dropdown (WAI-ARIA "select-only combobox"). Focus stays on the button; arrow keys, Home/End, type-to-find,
 * Enter/Space, Escape and Tab behave like a native select. A hidden input carries the value, so it works inside a
 * plain GET form. Desktop: dropdown panel. Phones: bottom sheet. Pass `value` to control it from outside.
 */
export function Select({
  name,
  label,
  options,
  defaultValue = '',
  value: controlled,
  onChange,
  className = '',
  labelClassName = 'text-sm font-semibold text-ink',
}: {
  name: string;
  label: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  labelClassName?: string;
}) {
  const uid = useId();
  const id = { label: `${uid}l`, trigger: `${uid}t`, list: `${uid}x`, opt: (i: number) => `${uid}o${i}` };
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const isPhone = useIsPhone();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const last = options.length - 1;

  const show = (at = selectedIndex) => {
    setActive(at);
    setOpen(true);
  };
  const hide = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const choose = (i: number, refocus = true) => {
    const v = options[i]!.value;
    setInner(v);
    onChange?.(v);
    hide(refocus);
  };

  // Close when tapping or clicking anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !sheetRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Keep the highlighted option in view while moving with the keyboard.
  useEffect(() => {
    if (open) document.getElementById(`${uid}o${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, uid]);

  function find(char: string, from: number) {
    const now = Date.now();
    typed.current = { text: now - typed.current.at > 600 ? char : typed.current.text + char, at: now };
    const q = typed.current.text.toLowerCase();
    for (let step = 1; step <= options.length; step++) {
      const i = (from + step) % options.length;
      if (options[i]!.label.toLowerCase().startsWith(q)) return i;
    }
    return from;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const printable = e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show();
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        show(e.key === 'Home' ? 0 : last);
      } else if (printable) {
        show(find(e.key, selectedIndex));
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(last, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) choose(active);
        else setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'PageDown':
        e.preventDefault();
        setActive((a) => Math.min(last, a + 10));
        break;
      case 'PageUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 10));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        hide();
        break;
      case 'Tab':
        choose(active, false);
        break;
      default:
        if (printable) setActive((a) => find(e.key, a));
    }
  }

  const list = (
    <ul id={id.list} role="listbox" aria-labelledby={id.label} tabIndex={-1} className="select-list">
      {options.map((o, i) => (
        <li
          key={o.value || '__any'}
          id={id.opt(i)}
          role="option"
          aria-selected={o.value === value}
          data-active={i === active ? '' : undefined}
          onPointerMove={() => setActive(i)}
          onClick={() => choose(i)}
          className="select-option"
        >
          <span>{o.label}</span>
          {o.value === value ? <Check /> : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={rootRef} className={`relative grid min-w-0 gap-1.5 ${className}`}>
      <span id={id.label} className={labelClassName} onClick={() => triggerRef.current?.focus()}>
        {label}
      </span>
      <button
        ref={triggerRef}
        id={id.trigger}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id.list}
        aria-labelledby={id.label}
        aria-activedescendant={open ? id.opt(active) : undefined}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        className="select-trigger"
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <svg viewBox="0 0 24 24" className="select-chevron size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <input type="hidden" name={name} value={value} />

      {open && !isPhone ? <div className="select-panel">{list}</div> : null}

      {open && isPhone
        ? createPortal(
            <div ref={sheetRef}>
              <div className="select-backdrop" onClick={() => hide()} aria-hidden="true" />
              <div className="select-sheet" role="dialog" aria-modal="true" aria-labelledby={id.label}>
                <div className="flex items-center justify-between px-3 pb-2 pt-1">
                  <span className="text-h3">{label}</span>
                  <button type="button" onClick={() => hide()} className="grid size-11 place-items-center rounded-brand text-ink" aria-label="Close">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </div>
                {list}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
