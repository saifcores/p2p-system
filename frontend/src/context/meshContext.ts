import { createContext } from "react";
import type { DataContextValue } from "./meshTypes";

export const MeshDataContext = createContext<DataContextValue | null>(null);
