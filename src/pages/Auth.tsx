import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Mail, Lock, User, Zap, BookOpen, Gem } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export default function Auth() {
  const { signUp, signIn, signInAsDemo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      signUpSchema.parse(signUpData);
      setIsLoading(true);
      await signUp(signUpData.email, signUpData.password, signUpData.fullName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      signInSchema.parse(signInData);
      setIsLoading(true);
      await signIn(signInData.email, signInData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signInAsDemo();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 facet-grid overflow-hidden">

      {/* Decorative background elements */}
      <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] w-80 h-80 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-card animate-fade-up border-t-4 border-t-accent glow-emerald relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 animate-float shadow-[0_0_30px_rgba(4,191,138,0.3)]">
            <Gem className="w-8 h-8 text-accent text-glow-emerald" />
          </div>
          <h1 className="text-display !text-4xl tracking-widest uppercase">Facet RWA</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-[280px]">
            Tokenización y custodia física de esmeraldas de alta gama.
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/[0.04] p-1 border border-white/[0.08] h-12 rounded-xl mb-8">
            <TabsTrigger value="signin" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold uppercase tracking-widest text-[10px]">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold uppercase tracking-widest text-[10px]">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="animate-fade-in">
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label className="label-uppercase">Email Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10 input-professional"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                </div>
                {errors.email && <p className="text-[10px] text-destructive font-bold uppercase">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label className="label-uppercase">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 input-professional"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                  />
                </div>
                {errors.password && <p className="text-[10px] text-destructive font-bold uppercase">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full btn-primary py-6" disabled={isLoading}>
                {isLoading ? 'Autenticando...' : 'Acceder al Hub'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="animate-fade-in">
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label className="label-uppercase">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Juan Pérez"
                    className="pl-10 input-professional"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                  />
                </div>
                {errors.fullName && <p className="text-[10px] text-destructive font-bold uppercase">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label className="label-uppercase">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10 input-professional"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
                {errors.email && <p className="text-[10px] text-destructive font-bold uppercase">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label className="label-uppercase">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 input-professional"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                  />
                </div>
                {errors.password && <p className="text-[10px] text-destructive font-bold uppercase">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full btn-primary py-6" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Registrar Identidad'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
            <span className="bg-[#0a0e14] px-3 text-muted-foreground">Acceso Rápido</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDemoLogin}
            disabled={isLoading}
            variant="outline"
            className="border-white/[0.1] hover:bg-white/[0.05] h-12 text-xs font-semibold"
          >
            <Zap className="mr-2 h-3.5 w-3.5 text-accent" />
            Demo
          </Button>
          <a
            href="https://www.notion.so/2897cb4a6fac80c29ffeda8c7d5f76d8?pvs=25"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="w-full border-white/[0.1] hover:bg-white/[0.05] h-12 text-xs font-semibold"
            >
              <BookOpen className="mr-2 h-3.5 w-3.5 text-blue-400" />
              Docs
            </Button>
          </a>
        </div>

        <p className="text-[9px] text-center text-muted-foreground mt-8 uppercase tracking-[0.2em] opacity-40">
          Polkadot Asset Hub • Secured by Facet
        </p>
      </div>
    </div>
  );
}
