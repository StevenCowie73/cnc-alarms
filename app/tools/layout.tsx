import { RegisterToolsSW } from "./RegisterToolsSW";

// Shared layout for /tools: registers the offline service worker for
// every calculator page (they're pure client-side math — after one
// online visit they work with no wifi at the machine).
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RegisterToolsSW />
    </>
  );
}
