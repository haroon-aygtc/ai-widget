import React from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage: React.FC = () => {
  return (
    <AuthLayout
      title="Welcome to Al Yalayis Business Hub"
      description="Access your dashboard to manage AI chat widgets, analytics, and more."
      image="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
