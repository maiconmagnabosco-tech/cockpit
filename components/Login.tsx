import React, { useState } from 'react';
import { ArrowRight, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin();
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-sans">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-[1px]"></div>
        <img 
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop" 
          alt="Logistics Truck Background" 
          className="w-full h-full object-cover grayscale opacity-60"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-20 flex h-full">
        {/* Login Section - Left Side */}
        <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-black/50 backdrop-blur-md border-r border-piano-700 shadow-2xl animate-in slide-in-from-left-8 duration-700">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center border-b border-piano-700 pb-8">
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">MAGNABOSCO</h1>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-cyan-500"></span>
                <p className="text-sm text-cyan-400 font-medium tracking-widest uppercase">
                  Gestão de Cockpit
                </p>
                <span className="h-px w-8 bg-cyan-500"></span>
              </div>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-piano-muted mb-1 ml-1 uppercase">ID Corporativo</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-piano-700 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-piano-700 rounded bg-piano-800/80 text-white placeholder-piano-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-all"
                        placeholder="Usuário"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-piano-muted mb-1 ml-1 uppercase">Senha de Acesso</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-piano-700 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-piano-700 rounded bg-piano-800/80 text-white placeholder-piano-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-all"
                        placeholder="••••••••"
                        />
                    </div>
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded text-black bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <ArrowRight className="h-5 w-5 text-black/50 group-hover:text-black transition-colors" />
                </span>
                ENTRAR NO SISTEMA
              </button>
            </form>
            
            <div className="mt-8 pt-6 text-center">
                <p className="text-[10px] text-piano-700 mb-3 uppercase tracking-widest">Powered By</p>
                <div className="flex justify-center items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                    <span className="font-bold text-white tracking-widest text-xl">MAGNABOSCO</span>
                    <span className="h-4 w-px bg-cyan-500"></span>
                    <span className="font-bold text-cyan-500 tracking-widest text-lg">LOGÍSTICA</span>
                </div>
            </div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:block lg:w-[60%] relative">
             <div className="absolute bottom-12 right-12 text-right max-w-lg p-8">
                <h2 className="text-6xl font-bold text-white mb-0 tracking-tighter drop-shadow-2xl">
                    PRECISÃO
                </h2>
                <h2 className="text-6xl font-bold text-cyan-400 mb-4 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    & CONTROLE
                </h2>
                <p className="text-piano-muted text-lg mt-4 font-light border-l-2 border-cyan-500 pl-4 bg-black/50 backdrop-blur-md py-2">
                    Sistema integrado de gestão de performance de contratos.
                </p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Login;