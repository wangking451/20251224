import React, { useState } from 'react';
import { Lock, User, AlertCircle, Shield } from 'lucide-react';
import { authAPI } from '../services/supabase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔐 Supabase认证
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 使用Supabase登录
      await authAPI.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || '用户名或密码错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-synth-bg flex items-center justify-center p-4">
      <div className="relative border-2 border-neon-cyan bg-synth-panel max-w-md w-full shadow-[0_0_50px_rgba(0,249,255,0.3)]">
        {/* 装饰角 */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-neon-pink"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-neon-pink"></div>
        
        <div className="p-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-cyan/10 border-2 border-neon-cyan rounded-full mb-4">
              <Shield className="text-neon-cyan" size={32} />
            </div>
            <h2 className="font-display text-2xl font-black text-white uppercase italic tracking-wider">
              管理员登录
            </h2>
            <p className="text-gray-400 text-xs font-display mt-2 uppercase tracking-widest">
              SECURE ACCESS REQUIRED
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="text-xs text-neon-cyan font-bold uppercase block mb-2 flex items-center gap-2">
                <User size={12} />
                邮箱
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-neon-cyan font-display transition-colors"
                placeholder="admin@nebula.com"
                required
                autoFocus
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="text-xs text-neon-cyan font-bold uppercase block mb-2 flex items-center gap-2">
                <Lock size={12} />
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-neon-cyan font-display transition-colors"
                placeholder="输入管理员密码"
                required
              />
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-transparent border-2 border-white/20 text-gray-400 hover:border-white/50 hover:text-white font-display font-bold uppercase text-sm transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-display font-bold uppercase text-sm shadow-[0_0_20px_rgba(0,249,255,0.3)] hover:shadow-[0_0_30px_rgba(0,249,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '验证中...' : '登录'}
              </button>
            </div>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-[10px] font-display uppercase tracking-wider text-center">
              📧 Supabase 认证
            </p>
            <p className="text-gray-600 text-[10px] font-display text-center mt-1">
              Email: admin@nebula.com
            </p>
            <p className="text-gray-600 text-[10px] font-display text-center">
              Password: ChangeMe@2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
