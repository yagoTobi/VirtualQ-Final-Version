"use client";
import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { createModal } from "@gluestack-ui/core/modal/creator";
import {
  withStyleContext,
  useStyleContext,
  tva,
} from "@gluestack-ui/utils/nativewind-utils";
import { withUniwind } from "uniwind";

// Browser portals must unmount synchronously after a completed action.
// Reanimated exiting views kept the closed dialog mounted in Safari.
const scope = "MODAL";
const UIModal = createModal({
  Root: withStyleContext(View, scope),
  Backdrop: withUniwind(Pressable),
  Content: withUniwind(View),
  Body: withUniwind(ScrollView),
  CloseButton: withUniwind(Pressable),
  Footer: withUniwind(View),
  Header: withUniwind(View),
});
type ModalProps = React.ComponentProps<typeof UIModal> & {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "full";
};
const contentStyle = tva({
  base: "rounded-xl border border-border bg-card p-6 shadow-xl",
  variants: {
    size: {
      xs: "w-11/12 max-w-sm",
      sm: "w-11/12 max-w-md",
      md: "w-11/12 max-w-lg",
      lg: "w-11/12 max-w-2xl",
      full: "w-full",
    },
  },
});

export const Modal = React.forwardRef<
  React.ComponentRef<typeof UIModal>,
  ModalProps
>(function Modal({ size = "md", className = "", ...props }, ref) {
  return (
    <UIModal
      ref={ref}
      className={`h-full w-full items-center justify-center ${className}`}
      context={{ size }}
      {...props}
    />
  );
});
export function ModalBackdrop(
  props: React.ComponentProps<typeof UIModal.Backdrop>,
) {
  return (
    <UIModal.Backdrop className="absolute inset-0 bg-overlay/50" {...props} />
  );
}
export const ModalContent = React.forwardRef<
  React.ComponentRef<typeof UIModal.Content>,
  React.ComponentProps<typeof UIModal.Content> & { className?: string }
>(function ModalContent({ className, ...props }, ref) {
  const { size } = useStyleContext(scope);
  return (
    <UIModal.Content
      ref={ref}
      className={contentStyle({ size, class: className })}
      {...props}
    />
  );
});
export function ModalHeader(
  props: React.ComponentProps<typeof UIModal.Header>,
) {
  return (
    <UIModal.Header
      className="flex-row items-center justify-between"
      {...props}
    />
  );
}
export function ModalBody(props: React.ComponentProps<typeof UIModal.Body>) {
  return <UIModal.Body className="mb-6 mt-4 max-h-[65vh] shrink" {...props} />;
}
export function ModalFooter(
  props: React.ComponentProps<typeof UIModal.Footer>,
) {
  return (
    <UIModal.Footer
      className="flex-row flex-wrap justify-end gap-3"
      {...props}
    />
  );
}
export function ModalCloseButton(
  props: React.ComponentProps<typeof UIModal.CloseButton>,
) {
  return (
    <UIModal.CloseButton
      className="min-h-11 min-w-11 items-center justify-center rounded-md"
      {...props}
    />
  );
}
