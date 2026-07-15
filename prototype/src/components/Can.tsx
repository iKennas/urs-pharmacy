import type { ReactNode } from "react";
import { usePermission } from "../hooks/usePermission";
import type { Permission } from "../api/types";

export function Can({
  perm,
  children,
  fallback = null,
}: {
  perm: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermission();
  return can(perm) ? <>{children}</> : <>{fallback}</>;
}
