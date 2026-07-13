import { useUser, useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";

type AdminRole = "admin" | "revenue_manager" | "front_desk" | "finance";

interface AdminAuth {
  user: any; // Using Clerk's user object
  role: AdminRole | null;
  loading: boolean;
  signIn: () => void; // Redirects to Clerk Login
  signOut: () => Promise<void>;
}

/**
 * Refactored Admin Authentication Hook
 * Now uses Clerk for Identity and Convex for Roles.
 */
export function useAdminAuth(): AdminAuth {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut, openSignIn } = useClerk();
  const navigate = useNavigate();
  
  // Fetch the role from Convex using the native user_roles table
  const role = useQuery(api.users.getMyRole) as AdminRole | null;

  const signIn = () => {
    openSignIn({
      afterSignInUrl: "/admin",
    });
  };

  const signOut = async () => {
    await clerkSignOut();
    navigate("/admin/login");
  };

  return { 
    user, 
    role, 
    loading: !isLoaded, 
    signIn, 
    signOut 
  };
}
