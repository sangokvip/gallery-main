// 用户管理工具
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'mprofile_user_id';
const USER_NICKNAME_KEY = 'mprofile_user_nickname';

export class UserManager {
  constructor() {
    this.userId = null;
    this.nickname = null;
    this.init();
  }

  // 初始化用户信息
  init() {
    // 尝试从localStorage获取用户ID
    this.userId = localStorage.getItem(USER_ID_KEY);
    this.nickname = localStorage.getItem(USER_NICKNAME_KEY);

    // 如果没有用户ID，生成一个新的
    if (!this.userId) {
      this.userId = this.generateUserId();
      localStorage.setItem(USER_ID_KEY, this.userId);
    }

    // 如果没有昵称，设置默认昵称
    if (!this.nickname) {
      this.nickname = '匿名用户';
      localStorage.setItem(USER_NICKNAME_KEY, this.nickname);
    }

    console.log('用户管理器初始化完成:', { userId: this.userId, nickname: this.nickname });
  }

  // 生成用户ID（基于UUID + 时间戳 + 随机数）
  generateUserId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const uuid = uuidv4().substring(0, 8);
    return `user_${timestamp}_${randomStr}_${uuid}`;
  }

  // 获取用户ID
  getUserId() {
    return this.userId;
  }

  // 获取用户昵称
  getNickname() {
    return this.nickname;
  }

  // 设置用户昵称
  setNickname(nickname) {
    if (!nickname || nickname.trim() === '') {
      nickname = '匿名用户';
    }
    
    this.nickname = nickname.trim();
    localStorage.setItem(USER_NICKNAME_KEY, this.nickname);
    console.log('用户昵称已更新:', this.nickname);
    return this.nickname;
  }

  // 重置用户信息（生成新的用户ID）
  resetUser() {
    this.userId = this.generateUserId();
    this.nickname = '匿名用户';
    
    localStorage.setItem(USER_ID_KEY, this.userId);
    localStorage.setItem(USER_NICKNAME_KEY, this.nickname);
    
    console.log('用户信息已重置:', { userId: this.userId, nickname: this.nickname });
    return { userId: this.userId, nickname: this.nickname };
  }

  // 清除用户信息
  clearUser() {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NICKNAME_KEY);
    this.userId = null;
    this.nickname = null;
    console.log('用户信息已清除');
  }

  // 获取用户信息对象
  getUserInfo() {
    return {
      userId: this.userId,
      nickname: this.nickname
    };
  }

  // 检查是否为有效用户
  isValidUser() {
    return !!(this.userId && this.nickname);
  }

  // 生成用户显示名称（用于UI显示）
  getDisplayName() {
    if (!this.nickname || this.nickname === '匿名用户') {
      return `匿名用户 (${this.userId?.substring(0, 8)}...)`;
    }
    return this.nickname;
  }

  // 导出用户数据（用于备份）
  exportUserData() {
    return {
      userId: this.userId,
      nickname: this.nickname,
      exportTime: new Date().toISOString()
    };
  }

  // 导入用户数据（用于恢复）
  importUserData(userData) {
    if (userData && userData.userId && userData.nickname) {
      this.userId = userData.userId;
      this.nickname = userData.nickname;
      
      localStorage.setItem(USER_ID_KEY, this.userId);
      localStorage.setItem(USER_NICKNAME_KEY, this.nickname);
      
      console.log('用户数据导入成功:', { userId: this.userId, nickname: this.nickname });
      return true;
    }
    return false;
  }
}

// 创建全局用户管理器实例
export const userManager = new UserManager();

// 导出便捷函数
export const getUserId = () => userManager.getUserId();
export const getNickname = () => userManager.getNickname();
export const setNickname = (nickname) => userManager.setNickname(nickname);
export const getUserInfo = () => userManager.getUserInfo();
export const getDisplayName = () => userManager.getDisplayName();
export const resetUser = () => userManager.resetUser();
export const clearUser = () => userManager.clearUser();

export default userManager;
