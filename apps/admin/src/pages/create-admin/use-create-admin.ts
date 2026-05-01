import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "@/services/api";

export function useCreateAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !name || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await post("/admin/admins", { email, name, password });
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  };
}
