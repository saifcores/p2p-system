import { useContext } from "react";
import { MeshDataContext } from "./meshContext";
import type { DataContextValue } from "./meshTypes";

export function useMeshData(): DataContextValue {
  const ctx = useContext(MeshDataContext);
  if (!ctx) throw new Error("useMeshData must be used within DataProvider");
  return ctx;
}
