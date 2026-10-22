import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

// React 19: ref is passed directly as a prop
const Card = ({ className, ref, ...props }: CardProps) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  />
);

const CardHeader = ({ className, ref, ...props }: CardHeaderProps) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ref, ...props }: CardTitleProps) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);

const CardDescription = ({ className, ref, ...props }: CardDescriptionProps) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

const CardContent = ({ className, ref, ...props }: CardContentProps) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ref, ...props }: CardFooterProps) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
