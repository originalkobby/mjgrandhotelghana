import { SignIn } from "@clerk/clerk-react";

const AdminLogin = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn routing="path" path="/admin/login" />
    </div>
  );
};

export default AdminLogin;
