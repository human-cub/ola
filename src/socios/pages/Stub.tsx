import { Link } from "react-router-dom";
import { SociosHeader } from "../SociosHeader";
import { useState } from "react";

export const StubPage = ({ title, message }: { title: string; message: string }) => {
  const [search, setSearch] = useState("");
  return (
    <div className="min-h-screen bg-background pb-32">
      <SociosHeader search={search} onSearchChange={setSearch} />
      <main className="pt-[120px] px-3">
        <div className="container mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold mb-3">{title}</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Link to="/" className="text-primary underline">Volver al catálogo</Link>
        </div>
      </main>
    </div>
  );
};