import * as React from "react";

export function Alert({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={"relative w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive " + className} {...props} />
  );
}

export function AlertDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={"text-sm " + className} {...props} />;
}
