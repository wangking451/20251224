/**
 * 认证工具函数
 * 提供管理员会话管理和权限验证
 */

// 使用Web Crypto API进行密码加密
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证密码
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 检查管理员是否已登录
export const isAdminAuthenticated = (): boolean => {
  const token = localStorage.getItem('_admin_token');
  const tokenTime = localStorage.getItem('_admin_token_time');
  
  if (!token || !tokenTime) {
    return false;
  }
  
  // 检查token是否过期（8小时有效期）
  const expirationTime = 8 * 60 * 60 * 1000; // 8小时
  const elapsed = Date.now() - parseInt(tokenTime);
  
  if (elapsed > expirationTime) {
    // Token已过期，清除
    clearAdminSession();
    return false;
  }
  
  return true;
};

// 清除管理员会话
export const clearAdminSession = () => {
  localStorage.removeItem('_admin_token');
  localStorage.removeItem('_admin_token_time');
};

// 设置管理员会话
export const setAdminSession = () => {
  const token = generateToken();
  localStorage.setItem('_admin_token', token);
  localStorage.setItem('_admin_token_time', Date.now().toString());
};

// 生成随机token
const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// 修改管理员密码
export const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const savedHash = localStorage.getItem('_admin_hash');
    
    if (!savedHash) {
      return false;
    }
    
    // 验证当前密码
    const isValid = await verifyPassword(currentPassword, savedHash);
    if (!isValid) {
      return false;
    }
    
    // 设置新密码
    const newHash = await hashPassword(newPassword);
    localStorage.setItem('_admin_hash', newHash);
    
    // 清除当前会话，要求重新登录
    clearAdminSession();
    
    return true;
  } catch (err) {
    console.error('Password change error:', err);
    return false;
  }
};

// 验证密码强度
export const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符' };
  }
  
  return { valid: true, message: '密码强度符合要求' };
};

// Sanitize用户输入，防止XSS攻击
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// 验证Email格式
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证URL格式
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
