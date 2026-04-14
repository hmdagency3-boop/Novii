"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[13px]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-medium group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          success:
            "group-[.toaster]:!bg-emerald-500/10 group-[.toaster]:!border-emerald-500/20 group-[.toaster]:!text-emerald-700 dark:group-[.toaster]:!text-emerald-300 group-[.toaster]:backdrop-blur-xl",
          error:
            "group-[.toaster]:!bg-red-500/10 group-[.toaster]:!border-red-500/20 group-[.toaster]:!text-red-700 dark:group-[.toaster]:!text-red-300 group-[.toaster]:backdrop-blur-xl",
          warning:
            "group-[.toaster]:!bg-amber-500/10 group-[.toaster]:!border-amber-500/20 group-[.toaster]:!text-amber-700 dark:group-[.toaster]:!text-amber-300 group-[.toaster]:backdrop-blur-xl",
          info:
            "group-[.toaster]:!bg-blue-500/10 group-[.toaster]:!border-blue-500/20 group-[.toaster]:!text-blue-700 dark:group-[.toaster]:!text-blue-300 group-[.toaster]:backdrop-blur-xl",
          title: "group-[.toast]:font-semibold group-[.toast]:text-[14px]",
          closeButton:
            "group-[.toast]:bg-background/50 group-[.toast]:border-border/30 group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-background group-[.toast]:rounded-full",
        },
      }}
      gap={8}
      offset={16}
      duration={3000}
      closeButton={false}
      expand={false}
      visibleToasts={3}
      {...props}
    />
  )
}

export { Toaster }
