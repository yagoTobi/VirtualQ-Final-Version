import { Redirect } from "expo-router";

// Operations use browser forms and tables; visitor navigation stays native.
export function OperationsShell() {
  return <Redirect href="/" />;
}
export const OperationsOverview = OperationsShell;
export const OperationsResource = OperationsShell;
