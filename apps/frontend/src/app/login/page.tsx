import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030303]">
      {/* Premium background gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6">
        <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-2xl font-bold text-primary">IN</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Zenith <span className="text-primary">ERP</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            The next generation of inventory and warehouse management.
          </p>
        </div>

        <LoginForm />
        
        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; 2026 INVSYS Microservices Platform. All rights reserved.
        </p>
      </div>
    </main>
  );
}
