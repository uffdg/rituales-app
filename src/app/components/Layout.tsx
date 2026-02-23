import { Outlet } from "react-router";
import { Toaster } from "sonner";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#EEEAE6] flex items-center justify-center">
      <div
        className="relative w-full max-w-[390px] min-h-screen bg-white overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <Outlet />
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#0A0A0A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </div>
  );
}
