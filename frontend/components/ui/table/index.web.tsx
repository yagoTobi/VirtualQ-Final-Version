import type { ComponentProps } from "react";

// gluestack's web Table contract uses native table elements. Keep the copied
// web-only primitives on our semantic tokens; no table engine is needed.
export function Table({ className = "", ...props }: ComponentProps<"table">) {
  return (
    <table
      className={`w-full border-collapse text-left text-sm text-foreground ${className}`}
      {...props}
    />
  );
}
export function TableHeader(props: ComponentProps<"thead">) {
  return <thead className="bg-muted/60" {...props} />;
}
export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}
export function TableRow(props: ComponentProps<"tr">) {
  return (
    <tr
      className="border-b border-border last:border-b-0 hover:bg-accent/40"
      {...props}
    />
  );
}
export function TableHead(props: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-5 py-4 font-semibold text-muted-foreground"
      {...props}
    />
  );
}
export function TableData(props: ComponentProps<"td">) {
  return <td className="px-5 py-3 align-middle" {...props} />;
}
export function TableCaption(props: ComponentProps<"caption">) {
  return <caption className="sr-only" {...props} />;
}
