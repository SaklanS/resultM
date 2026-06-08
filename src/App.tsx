import { useState } from "react";
import PublicPortal from "./components/PublicPortal";
import AdminPortal from "./components/AdminPortal";
import StudentPortal from "./components/StudentPortal";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<"public" | "admin" | "student">("public");

  return (
    <div className="min-h-screen bg-slate-50">
      {currentRoute === "public" ? (
        <PublicPortal 
          onGoToAdmin={() => setCurrentRoute("admin")} 
          onGoToStudentPortal={() => setCurrentRoute("student")}
        />
      ) : currentRoute === "student" ? (
        <StudentPortal onLogout={() => setCurrentRoute("public")} />
      ) : (
        <AdminPortal onLogout={() => setCurrentRoute("public")} />
      )}
    </div>
  );
}
