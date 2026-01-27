"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current!);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={innerRef}
          checked={checked}
          className={cn(
            "peer h-4 w-4 shrink-0 appearance-none rounded border border-slate-300 bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "checked:border-slate-900 checked:bg-slate-900",
            className
          )}
          {...props}
        />
        <span className="pointer-events-none absolute left-0 top-0 flex h-4 w-4 items-center justify-center text-white opacity-0 peer-checked:opacity-100">
          {indeterminate ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </span>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
