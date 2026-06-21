import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — POS Minimarket" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp, signInWithGoogle, enterDemo, isDemo, loading } =
    useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (user || isDemo)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isDemo, loading, navigate]);

  const handle = async (mode: "in" | "up") => {
    if (!email || !password) {
      toast.error("Ingresa email y contraseña");
      return;
    }
    setSubmitting(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (res.error) toast.error(res.error);
    else if (mode === "up") toast.success("Revisa tu correo para confirmar la cuenta");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/15 via-background to-accent/10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">POS Minimarket</h1>
              <p className="text-muted-foreground">Punto de venta para tu bodega 🇵🇪</p>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Ventas rápidas con lector de código de barras",
              "Boletas, facturas y tickets con IGV 18%",
              "Yape, Plin, efectivo, tarjeta y pago MIXTO",
              "Inventario, caja, compras y reportes en un solo lugar",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="p-6 md:p-8 shadow-xl border-border/60">
          <h2 className="text-xl font-bold mb-1">Bienvenido</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Inicia sesión con tu cuenta o entra en modo demo.
          </p>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">Ingresar</TabsTrigger>
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full" disabled={submitting} onClick={() => handle("in")}>
                {submitting ? "Ingresando…" : "Ingresar"}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="r-email">Correo</Label>
                <Input id="r-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-password">Contraseña</Label>
                <Input id="r-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full" disabled={submitting} onClick={() => handle("up")}>
                {submitting ? "Creando…" : "Crear cuenta"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            Continuar con Google
          </Button>

          <Button
            variant="secondary"
            className="w-full mt-3"
            onClick={() => {
              enterDemo();
              toast.success("Modo demo activado");
              navigate({ to: "/dashboard" });
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Entrar en modo demo
          </Button>
        </Card>
      </div>
    </div>
  );
}