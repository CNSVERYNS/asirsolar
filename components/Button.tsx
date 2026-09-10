import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  href?: string;
  className?: string;
};

function Arrow() {
  return (
    <span className="btn__arrow" aria-hidden="true">
      ↗
    </span>
  );
}

export function PrimaryButton({
  children,
  href,
  className = "",
  ...rest
}: CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `btn btn--primary ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        <Arrow />
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
      <Arrow />
    </button>
  );
}

export function OutlineButton({
  children,
  href,
  className = "",
  ...rest
}: CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `btn btn--outline ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

export function TextLink({
  children,
  href,
  className = "",
  arrow = "→",
}: CommonProps & { arrow?: string }) {
  return (
    <Link href={href ?? "#"} className={`text-link ${className}`.trim()}>
      {children}
      {arrow ? (
        <span aria-hidden="true" style={{ display: "inline-block" }}>
          {arrow}
        </span>
      ) : null}
    </Link>
  );
}
