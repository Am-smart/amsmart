/**
 * Minimal compatibility shim mapping the small surface of `next/navigation`
 * and `next/image` used by the ported legacy components onto their
 * TanStack Router / native HTML equivalents.
 *
 * Keeping this in one place avoids touching dozens of legacy files and
 * keeps the migration reversible — a future cleanup can replace these
 * imports with direct TanStack equivalents.
 */
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate({ to: href }),
      replace: (href: string) => navigate({ to: href, replace: true }),
      back: () => {
        if (typeof window !== "undefined") window.history.back();
      },
      forward: () => {
        if (typeof window !== "undefined") window.history.forward();
      },
      refresh: () => {
        if (typeof window !== "undefined") window.location.reload();
      },
      prefetch: (_href: string) => Promise.resolve(),
    }),
    [navigate],
  );
}

export function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function useSearchParams(): URLSearchParams {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  return useMemo(() => new URLSearchParams(search || ""), [search]);
}

// `next/link` default-import shim
import { Link as TSLink } from "@tanstack/react-router";
import React from "react";

type LinkProps = {
  href: string;
  children?: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  replace?: boolean;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, prefetch: _p, ...rest },
  ref,
) {
  // External links pass through to a plain anchor.
  if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("#")) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <TSLink ref={ref as never} to={href} {...rest}>
      {children}
    </TSLink>
  );
});
export default Link;

// `next/image` default-import shim
export const Image = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }>(
  function Image(props, ref) {
    return <img ref={ref} {...props} />;
  },
);
