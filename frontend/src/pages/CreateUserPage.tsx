import React, { useState } from "react";
import { GrpcWebImpl, UserServiceClientImpl } from "../grpc/gen/user"; // adjust path
import { CreateUserRequest } from "../grpc/gen/user"; // adjust path
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined, // optional, default uses fetch
    metadata: new BrowserHeaders(),
});

const client = new UserServiceClientImpl(transport);

export default function CreateUserPage() {
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: "",
    email: "",
    password: "",
    displayName: "",
    bio: "",
    avatarUrl: "",
    country: "",
  });

  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await client.CreateUser(formData);
      setResponse(result.response);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setResponse(null);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
      <h2>Create User</h2>
      <form onSubmit={handleSubmit}>
        {["username", "email", "password", "displayName", "bio", "avatarUrl", "country"].map((field) => (
          <div key={field} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </label>
            {field === "bio" ? (
              <textarea name={field} value={formData[field as keyof CreateUserRequest] || ""} onChange={handleChange} />
            ) : (
              <input
                type={field === "password" ? "password" : "text"}
                name={field}
                value={formData[field as keyof CreateUserRequest] || ""}
                onChange={handleChange}
              />
            )}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>

      {response && (
        <div style={{ marginTop: 20 }}>
          <h4>User Created:</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div style={{ color: "red", marginTop: 20 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
