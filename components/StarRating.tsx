"use client";

import clsx from "clsx";

interface Props {
  value: number; // 0-5, can be fractional
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  count?: number;
  onChange?: (n: number) => void;
}

export function StarRating({
  value,
  size = "sm",
  showNumber = false,
  count,
  onChange,
}: Props) {
  const px = size === "lg" ? 22 : size === "md" ? 16 : 13;
  const interactive = !!onChange;
  const stars = [1, 2, 3, 4, 5].map((i) => {
    const filled = value >= i;
    const half = !filled && value >= i - 0.5;
    return { i, filled, half };
  });
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={clsx(
          "inline-flex items-center",
          interactive && "gap-1",
        )}
      >
        {stars.map(({ i, filled, half }) => {
          const Wrapper: React.ElementType = interactive ? "button" : "span";
          return (
            <Wrapper
              key={i}
              {...(interactive
                ? {
                    type: "button",
                    onClick: () => onChange?.(i),
                    "aria-label": `Rate ${i} stars`,
                    className:
                      "press inline-flex h-11 w-11 items-center justify-center text-amber-400 hover:text-amber-300 sm:h-7 sm:w-7",
                  }
                : { className: "inline-flex text-amber-400" })}
            >
              <svg
                width={px}
                height={px}
                viewBox="0 0 24 24"
                fill={filled || half ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.6}
                aria-hidden
              >
                <defs>
                  <linearGradient id={`half-${i}-${px}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={half ? `url(#half-${i}-${px})` : undefined}
                />
              </svg>
            </Wrapper>
          );
        })}
      </span>
      {showNumber && (
        <span className="text-xs font-medium text-muted-strong">
          {value.toFixed(1)}
          {count != null && (
            <span className="ml-1 text-muted">· {compactNumber(count)}</span>
          )}
        </span>
      )}
    </span>
  );
}

function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}
