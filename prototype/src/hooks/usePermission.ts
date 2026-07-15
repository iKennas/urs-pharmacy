import { useAuth } from "../context/AuthContext";
import type { Permission } from "../api/types";

export function usePermission() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];

  function can(perm: Permission | Permission[]) {
    const list = Array.isArray(perm) ? perm : [perm];
    return list.some((p) => permissions.includes(p));
  }

  return { can, permissions };
}
