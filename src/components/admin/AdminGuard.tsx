import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const { isAdmin, checked } = useAdminAuth();

  useEffect(() => {
    if (checked && !isAdmin) navigate("/dragonutopia/login");
  }, [checked, isAdmin, navigate]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking access...
      </div>
    );
  }

  if (!isAdmin) return null;
  return <>{children}</>;
}
