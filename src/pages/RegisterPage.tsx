import React from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

const RegisterPage: React.FC = () => {
  return (
    <AuthLayout
      title="Join Al Yalayis Business Hub"
      description="Create an account to access our AI chat widget platform and business services."
      image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
