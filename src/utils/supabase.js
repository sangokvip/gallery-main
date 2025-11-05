import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端实例
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('环境变量缺失，数据库功能将被禁用：', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  // 不抛出错误，而是创建一个模拟客户端
}

// 创建安全的Supabase客户端
let supabase;
if (supabaseUrl && supabaseAnonKey) {
  console.log('Initializing Supabase client with URL:', supabaseUrl);
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase环境变量缺失，使用模拟客户端');
  // 创建一个模拟客户端，所有方法都返回空结果或错误
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: new Error('数据库未配置') }),
      insert: () => ({ data: null, error: new Error('数据库未配置') }),
      update: () => ({ data: null, error: new Error('数据库未配置') }),
      delete: () => ({ data: null, error: new Error('数据库未配置') }),
      upsert: () => ({ data: null, error: new Error('数据库未配置') })
    })
  };
}

export { supabase }

// 消息相关的数据库操作
export const messagesApi = {
  // 获取所有消息
  async getMessages() {
    console.log('正在获取消息列表...');
    try {
      // 首先获取所有消息
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          original_text,
          user_id,
          created_at,
          is_pinned
        `)
        .order('created_at', { ascending: false }); // 先按时间排序，后面会重新排序

      if (messagesError) {
        console.error('获取消息失败:', messagesError);
        throw messagesError;
      }

      if (!messages) {
        console.log('没有找到任何消息');
        return [];
      }

      console.log('成功获取原始消息:', messages.length, '条');

      // 获取每条消息的反应数据
      const messagesWithReactions = await Promise.all(
        messages.map(async (message) => {
          try {
            // 获取点赞数
            const { data: likes, error: likesError } = await supabase
              .from('message_reactions')
              .select('id')
              .eq('message_id', message.id)
              .eq('is_like', true);

            if (likesError) {
              console.error(`获取消息 ${message.id} 的点赞数失败:`, likesError);
              return {
                ...message,
                reactions: { likes: 0, dislikes: 0 },
                reply_count: 0
              };
            }

            // 获取点踩数
            const { data: dislikes, error: dislikesError } = await supabase
              .from('message_reactions')
              .select('id')
              .eq('message_id', message.id)
              .eq('is_like', false);

            if (dislikesError) {
              console.error(`获取消息 ${message.id} 的点踩数失败:`, dislikesError);
              return {
                ...message,
                reactions: { likes: 0, dislikes: 0 },
                reply_count: 0
              };
            }

            // 获取回复数量
            const { data: replies, error: repliesError } = await supabase
              .from('message_replies')
              .select('id')
              .eq('message_id', message.id);

            if (repliesError) {
              console.error(`获取消息 ${message.id} 的回复数失败:`, repliesError);
              return {
                ...message,
                reactions: {
                  likes: likes?.length || 0,
                  dislikes: dislikes?.length || 0
                },
                reply_count: 0
              };
            }

            return {
              ...message,
              reactions: {
                likes: likes?.length || 0,
                dislikes: dislikes?.length || 0
              },
              reply_count: replies?.length || 0
            };
          } catch (error) {
            console.error(`处理消息 ${message.id} 的数据时出错:`, error);
            // 如果获取反应失败，返回原始消息，但反应数为0
            return {
              ...message,
              reactions: {
                likes: 0,
                dislikes: 0
              },
              reply_count: 0
            };
          }
        })
      );

      console.log('成功获取所有消息的反应数据');

      // 按优先级排序：
      // 1. 管理员消息
      // 2. 置顶消息
      // 3. 点赞数
      // 4. 创建时间
      const sortedMessages = messagesWithReactions.sort((a, b) => {
        // 管理员消息始终最优先
        if (a.user_id === 'admin' && b.user_id !== 'admin') return -1;
        if (a.user_id !== 'admin' && b.user_id === 'admin') return 1;
        
        // 如果都是管理员消息，按时间排序
        if (a.user_id === 'admin' && b.user_id === 'admin') {
          return new Date(b.created_at) - new Date(a.created_at);
        }

        // 非管理员消息，先比较置顶状态
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        // 如果置顶状态相同，比较点赞数
        const aLikes = a.reactions?.likes || 0;
        const bLikes = b.reactions?.likes || 0;
        if (aLikes !== bLikes) return bLikes - aLikes;

        // 最后按时间排序
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      console.log(`成功获取并排序 ${sortedMessages.length} 条消息`);
      return sortedMessages;
    } catch (error) {
      console.error('获取消息时发生错误:', error);
      throw new Error('获取消息失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取热门消息（点赞数最多的前3条）
  async getTopMessages() {
    console.log('正在获取热门消息...');
    try {
      // 首先获取所有消息
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*');

      if (messagesError) {
        console.error('获取热门消息失败:', messagesError);
        throw messagesError;
      }

      // 获取每条消息的反应数据
      const messagesWithReactions = await Promise.all(
        messages.map(async (message) => {
          // 获取点赞数
          const { data: likes, error: likesError } = await supabase
            .from('message_reactions')
            .select('id')
            .eq('message_id', message.id)
            .eq('is_like', true);

          // 获取点踩数
          const { data: dislikes, error: dislikesError } = await supabase
            .from('message_reactions')
            .select('id')
            .eq('message_id', message.id)
            .eq('is_like', false);

          if (likesError) console.error('获取点赞数失败:', likesError);
          if (dislikesError) console.error('获取点踩数失败:', dislikesError);

          return {
            ...message,
            likes: likes?.length || 0,
            dislikes: dislikes?.length || 0
          };
        })
      );

      // 按点赞数排序并返回前3条
      const topMessages = messagesWithReactions
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3);

      console.log('成功获取热门消息:', topMessages);
      return topMessages;
    } catch (error) {
      console.error('获取热门消息时发生错误:', error);
      throw new Error('获取热门消息失败: ' + (error.message || '未知错误'));
    }
  },

  // 检查用户24小时内的反应次数
  async checkUserReactionLimit(userId) {
    console.log('正在检查用户24小时内的反应次数:', userId);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('message_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo);

      if (error) {
        console.error('检查反应次数失败:', error);
        throw error;
      }

      console.log('用户24小时内的反应次数:', count);
      return count || 0;
    } catch (error) {
      console.error('检查反应次数时发生错误:', error);
      throw new Error('检查反应次数失败: ' + (error.message || '未知错误'));
    }
  },

  // 添加反应（点赞/踩）
  async addReaction(messageId, userId, isLike) {
    console.log('正在添加反应:', { messageId, userId, isLike });
    try {
      // 首先检查用户24小时内的反应次数
      const reactionCount = await this.checkUserReactionLimit(userId);
      if (reactionCount >= 50) {
        throw new Error('您在24小时内的点赞/点踩次数已达到上限(50次)');
      }

      // 添加新的反应
      const { error: insertError } = await supabase
        .from('message_reactions')
        .insert([{
          message_id: messageId,
          user_id: userId,
          is_like: isLike,
          created_at: new Date().toISOString() // 添加创建时间
        }]);

      if (insertError) throw insertError;
      return { action: 'added' };
    } catch (error) {
      console.error('添加反应时发生错误:', error);
      throw new Error(error.message || '添加反应失败: 未知错误');
    }
  },

  // 获取消息的反应统计
  async getMessageReactions(messageId) {
    console.log('正在获取消息反应统计:', messageId);
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('is_like')
        .eq('message_id', messageId);

      if (error) {
        console.error('获取反应统计失败:', error);
        throw error;
      }

      // 直接计算总数，不考虑用户重复
      const likes = data.filter(r => r.is_like).length;
      const dislikes = data.filter(r => !r.is_like).length;

      return { 
        likes, 
        dislikes,
        total: likes + dislikes // 添加总数统计
      };
    } catch (error) {
      console.error('获取反应统计时发生错误:', error);
      throw new Error('获取反应统计失败: ' + (error.message || '未知错误'));
    }
  },

  // 检查是否存在重复消息
  async checkDuplicateMessage(text, userId) {
    console.log('正在检查是否存在重复消息:', { userId });
    try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
        .eq('text', text)
        .eq('user_id', userId)
        .limit(1);

    if (error) {
        console.error('检查重复消息失败:', error);
      throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('检查重复消息时发生错误:', error);
      throw new Error('检查重复消息失败: ' + (error.message || '未知错误'));
    }
  },

  // 创建新消息
  async createMessage({ text, userId, originalText }) {
    console.log('正在创建新消息:', { text, userId });
    try {
      // 首先检查是否存在重复消息
      const isDuplicate = await this.checkDuplicateMessage(text, userId);
      if (isDuplicate) {
        throw new Error('您已经发送过相同的留言了');
      }

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        text,
        user_id: userId,
          original_text: originalText,
          created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
        console.error('创建消息失败:', error);
      throw error;
    }

      console.log('消息创建成功:', data?.[0]?.id);
    return data[0];
    } catch (error) {
      console.error('创建消息时发生错误:', error);
      throw new Error(error.message || '创建消息失败');
    }
  },

  // 删除消息
  async deleteMessage(messageId, userId, isAdmin) {
    console.log('正在删除消息:', { messageId, userId, isAdmin });
    try {
      // 首先检查消息是否存在
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('查找消息失败:', fetchError);
        throw new Error('查找消息时出错');
      }

      if (!message) {
        console.error('消息不存在:', messageId);
        throw new Error('消息不存在');
      }

      // 检查权限
      if (!isAdmin && message.user_id !== userId) {
        console.error('无权限删除:', { messageUserId: message.user_id, userId });
        throw new Error('您没有权限删除此消息');
      }

      // 执行删除操作
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        console.error('删除消息失败:', deleteError);
        throw new Error('删除消息时出错');
      }

      console.log('消息删除成功:', messageId);
      return true;
    } catch (error) {
      console.error('删除消息时发生错误:', error);
      throw new Error('删除消息失败: ' + (error.message || '未知错误'));
    }
  },

  // 计算用户在过去24小时内的留言数量
  async countUserMessagesInLast24Hours(userId) {
    console.log('正在统计用户24小时内的留言数:', userId);
    try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo);

    if (error) {
        console.error('统计消息数量失败:', error);
        throw error;
      }

      console.log('用户24小时内的留言数:', count);
      return count || 0;
    } catch (error) {
      console.error('统计消息数量时发生错误:', error);
      return Infinity; // 返回无限大，确保用户无法发送新消息直到错误解决
    }
  },

  // 切换消息置顶状态
  async toggleMessagePin(messageId, isPinned) {
    console.log('正在切换消息置顶状态:', { messageId, isPinned });
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        console.error('切换置顶状态失败:', error);
        throw error;
      }

      console.log('消息置顶状态已更新:', data);
      return data;
    } catch (error) {
      console.error('切换置顶状态时发生错误:', error);
      throw new Error('切换置顶状态失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取消息的回复
  async getMessageReplies(messageId) {
    console.log('正在获取消息回复:', messageId);
    try {
      const { data, error } = await supabase
        .from('message_replies')
        .select(`
          id,
          message_id,
          user_id,
          text,
          original_text,
          created_at,
          is_admin
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('获取回复失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取回复时发生错误:', error);
      return [];
    }
  },

  // 创建新回复
  async createReply({ messageId, userId, text, originalText }) {
    console.log('正在创建回复:', { messageId, userId });
    try {
      // 检查24小时内的回复数量（仅对非管理员用户）
      if (userId !== 'admin') {
        const replyCount = await this.countUserMessagesAndRepliesInLast24Hours(userId);
        if (replyCount >= 6) {
          throw new Error('您在24小时内的留言和回复总数已达到上限(6条)');
        }
      }

      const { data, error } = await supabase
        .from('message_replies')
        .insert([{
          message_id: messageId,
          user_id: userId,
          text,
          original_text: originalText,
          is_admin: userId === 'admin',
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('创建回复失败:', error);
        throw error;
      }

      console.log('回复创建成功:', data?.[0]?.id);
      return data[0];
    } catch (error) {
      console.error('创建回复时发生错误:', error);
      throw new Error(error.message || '创建回复失败');
    }
  },

  // 删除回复
  async deleteReply(replyId, userId, isAdmin) {
    console.log('正在删除回复:', { replyId, userId, isAdmin });
    try {
      // 首先检查回复是否存在
      const { data: reply, error: fetchError } = await supabase
        .from('message_replies')
        .select('*')
        .eq('id', replyId)
        .single();

      if (fetchError) {
        console.error('查找回复失败:', fetchError);
        throw new Error('查找回复时出错');
      }

      if (!reply) {
        console.error('回复不存在:', replyId);
        throw new Error('回复不存在');
      }

      // 检查权限
      if (!isAdmin && reply.user_id !== userId) {
        console.error('无权限删除:', { replyUserId: reply.user_id, userId });
        throw new Error('您没有权限删除此回复');
      }

      // 执行删除操作
      const { error: deleteError } = await supabase
        .from('message_replies')
        .delete()
        .eq('id', replyId);

      if (deleteError) {
        console.error('删除回复失败:', deleteError);
        throw new Error('删除回复时出错');
      }

      console.log('回复删除成功:', replyId);
      return true;
    } catch (error) {
      console.error('删除回复时发生错误:', error);
      throw new Error('删除回复失败: ' + (error.message || '未知错误'));
    }
  },

  // 统计用户24小时内的留言和回复总数
  async countUserMessagesAndRepliesInLast24Hours(userId) {
    console.log('正在统计用户24小时内的留言和回复数:', userId);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 获取留言数量
      const { count: messageCount, error: messageError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo);

      if (messageError) throw messageError;

      // 获取回复数量
      const { count: replyCount, error: replyError } = await supabase
        .from('message_replies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo);

      if (replyError) throw replyError;

      const totalCount = (messageCount || 0) + (replyCount || 0);
      console.log('用户24小时内的总数:', totalCount);
      return totalCount;
    } catch (error) {
      console.error('统计留言和回复数量时发生错误:', error);
      return Infinity; // 返回无限大，确保用户无法发送新消息直到错误解决
    }
  },

  // 更新消息的赞踩数量（仅限管理员）
  async updateMessageReactions(messageId, likes, dislikes) {
    console.log('正在更新消息反应数量:', { messageId, likes, dislikes });
    try {
      // 首先删除该消息的所有现有反应
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId);

      if (deleteError) {
        console.error('删除现有反应失败:', deleteError);
        throw new Error('更新反应失败：无法删除现有反应');
      }

      // 添加新的点赞
      const likesPromises = Array(likes).fill().map(() => 
        supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: 'admin',
            is_like: true
          })
      );

      // 添加新的点踩
      const dislikesPromises = Array(dislikes).fill().map(() => 
        supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: 'admin',
            is_like: false
          })
      );

      // 等待所有操作完成
      const results = await Promise.all([...likesPromises, ...dislikesPromises]);
      
      // 检查是否有任何错误
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('添加新反应时发生错误:', errors);
        throw new Error('更新反应失败：无法添加新的反应');
      }

      console.log('成功更新消息反应数量');
      return true;
    } catch (error) {
      console.error('更新消息反应数量失败:', error);
      throw new Error('更新反应失败: ' + (error.message || '未知错误'));
    }
  }
}

// 测试记录相关的数据库操作
export const testRecordsApi = {
  // 检查表是否存在
  async checkTablesExist() {
    try {
      // 尝试查询每个表来检查是否存在
      const { error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const { error: recordsError } = await supabase
        .from('test_records')
        .select('id')
        .limit(1);

      const { error: resultsError } = await supabase
        .from('test_results')
        .select('id')
        .limit(1);

      return {
        users: !usersError,
        test_records: !recordsError,
        test_results: !resultsError,
        allExist: !usersError && !recordsError && !resultsError
      };
    } catch (error) {
      console.error('检查表存在性失败:', error);
      return {
        users: false,
        test_records: false,
        test_results: false,
        allExist: false
      };
    }
  },

  // 保存测试记录
  async saveTestRecord({ userId, nickname, testType, ratings, reportData }) {
    console.log('正在保存测试记录:', { userId, nickname, testType });
    try {
      // 首先检查表是否存在
      const tablesStatus = await this.checkTablesExist();
      if (!tablesStatus.allExist) {
        throw new Error(`数据库表不存在。缺少的表: ${Object.entries(tablesStatus).filter(([key, exists]) => key !== 'allExist' && !exists).map(([key]) => key).join(', ')}`);
      }

      // 首先保存或更新用户信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert([{
          id: userId,
          nickname: nickname || '匿名用户',
          last_active: new Date().toISOString()
        }], {
          onConflict: 'id'
        })
        .select();

      if (userError) {
        console.error('保存用户信息失败:', userError);
        throw userError;
      }

      // 准备测试记录数据，适配现有表结构
      const recordInsertData = {
        user_id_text: userId, // 使用新添加的 user_id_text 列
        test_type: testType,
        report_data: reportData, // 现在应该存在这个列
        created_at: new Date().toISOString()
      };

      // 保存测试记录
      const { data: recordData, error: recordError } = await supabase
        .from('test_records')
        .insert([recordInsertData])
        .select();

      if (recordError) {
        console.error('保存测试记录失败:', recordError);
        throw recordError;
      }

      const recordId = recordData[0].id;

      // 保存详细的测试结果
      const resultEntries = Object.entries(ratings).map(([key, rating]) => {
        const [category, item] = key.split('-');
        return {
          record_id: recordId,
          category,
          item,
          rating,
          created_at: new Date().toISOString()
        };
      });

      if (resultEntries.length > 0) {
        const { error: resultsError } = await supabase
          .from('test_results')
          .insert(resultEntries);

        if (resultsError) {
          console.error('保存测试结果失败:', resultsError);
          throw resultsError;
        }
      }

      console.log('测试记录保存成功:', recordId);
      return recordData[0];
    } catch (error) {
      console.error('保存测试记录时发生错误:', error);
      throw new Error('保存测试记录失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取用户的测试记录列表
  async getUserTestRecords(userId) {
    console.log('正在获取用户测试记录:', userId);
    try {
      const { data, error } = await supabase
        .from('test_records')
        .select(`
          id,
          test_type,
          report_data,
          created_at,
          updated_at
        `)
        .eq('user_id_text', userId) // 使用 user_id_text 列
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取测试记录失败:', error);
        throw error;
      }

      console.log('成功获取测试记录:', data?.length || 0, '条');
      return data || [];
    } catch (error) {
      console.error('获取测试记录时发生错误:', error);
      throw new Error('获取测试记录失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取特定测试记录的详细结果
  async getTestRecordDetails(recordId) {
    console.log('正在获取测试记录详情:', recordId);
    try {
      // 获取记录基本信息
      const { data: recordData, error: recordError } = await supabase
        .from('test_records')
        .select(`
          id,
          test_type,
          report_data,
          created_at,
          user_id_text
        `)
        .eq('id', recordId)
        .single();

      if (recordError) {
        console.error('获取记录基本信息失败:', recordError);
        throw recordError;
      }

      // 获取详细结果
      const { data: resultsData, error: resultsError } = await supabase
        .from('test_results')
        .select('category, item, rating')
        .eq('record_id', recordId);

      if (resultsError) {
        console.error('获取详细结果失败:', resultsError);
        throw resultsError;
      }

      // 重构ratings对象
      const ratings = {};
      resultsData.forEach(result => {
        ratings[`${result.category}-${result.item}`] = result.rating;
      });

      return {
        ...recordData,
        ratings
      };
    } catch (error) {
      console.error('获取测试记录详情时发生错误:', error);
      throw new Error('获取测试记录详情失败: ' + (error.message || '未知错误'));
    }
  },

  // 删除测试记录
  async deleteTestRecord(recordId, userId) {
    console.log('正在删除测试记录:', { recordId, userId });
    try {
      // 首先验证记录是否属于该用户
      const { data: recordData, error: fetchError } = await supabase
        .from('test_records')
        .select('user_id_text')
        .eq('id', recordId)
        .single();

      if (fetchError) {
        console.error('查找记录失败:', fetchError);
        throw new Error('查找记录时出错');
      }

      if (recordData.user_id_text !== userId) {
        throw new Error('您没有权限删除此记录');
      }

      // 删除记录（级联删除会自动删除相关的test_results）
      const { error: deleteError } = await supabase
        .from('test_records')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.error('删除记录失败:', deleteError);
        throw deleteError;
      }

      console.log('测试记录删除成功:', recordId);
      return true;
    } catch (error) {
      console.error('删除测试记录时发生错误:', error);
      throw new Error('删除测试记录失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取用户最新的测试记录
  async getLatestTestRecord(userId, testType) {
    console.log('正在获取最新测试记录:', { userId, testType });
    try {
      const { data, error } = await supabase
        .from('test_records')
        .select(`
          id,
          test_type,
          report_data,
          created_at
        `)
        .eq('user_id_text', userId) // 使用 user_id_text 列
        .eq('test_type', testType)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('获取最新记录失败:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // 获取详细结果
      const recordId = data[0].id;
      const { data: resultsData, error: resultsError } = await supabase
        .from('test_results')
        .select('category, item, rating')
        .eq('record_id', recordId);

      if (resultsError) {
        console.error('获取详细结果失败:', resultsError);
        return data[0]; // 返回基本信息，不包含详细结果
      }

      // 重构ratings对象
      const ratings = {};
      resultsData.forEach(result => {
        ratings[`${result.category}-${result.item}`] = result.rating;
      });

      return {
        ...data[0],
        ratings
      };
    } catch (error) {
      console.error('获取最新测试记录时发生错误:', error);
      return null; // 不抛出错误，返回null表示没有记录
    }
  },

  // 更新测试记录
  async updateTestRecord(recordId, { userId, nickname, ratings, reportData }) {
    console.log('正在更新测试记录:', { recordId, userId, nickname });
    try {
      // 首先检查表是否存在
      const tablesStatus = await this.checkTablesExist();
      if (!tablesStatus.allExist) {
        throw new Error(`数据库表不存在。缺少的表: ${Object.entries(tablesStatus).filter(([key, exists]) => key !== 'allExist' && !exists).map(([key]) => key).join(', ')}`);
      }

      // 验证记录是否属于该用户
      const { data: recordData, error: fetchError } = await supabase
        .from('test_records')
        .select('user_id_text')
        .eq('id', recordId)
        .single();

      if (fetchError) {
        console.error('查找记录失败:', fetchError);
        throw new Error('查找记录时出错');
      }

      if (recordData.user_id_text !== userId) {
        throw new Error('您没有权限更新此记录');
      }

      // 更新用户信息
      const { error: userError } = await supabase
        .from('users')
        .upsert([{
          id: userId,
          nickname: nickname || '匿名用户',
          last_active: new Date().toISOString()
        }], {
          onConflict: 'id'
        });

      if (userError) {
        console.error('更新用户信息失败:', userError);
        throw userError;
      }

      // 更新测试记录
      const { data: updatedRecord, error: updateError } = await supabase
        .from('test_records')
        .update({
          report_data: reportData,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select();

      if (updateError) {
        console.error('更新测试记录失败:', updateError);
        throw updateError;
      }

      // 删除旧的测试结果
      const { error: deleteResultsError } = await supabase
        .from('test_results')
        .delete()
        .eq('record_id', recordId);

      if (deleteResultsError) {
        console.error('删除旧测试结果失败:', deleteResultsError);
        throw deleteResultsError;
      }

      // 插入新的测试结果
      const resultEntries = Object.entries(ratings).map(([key, rating]) => {
        const [category, item] = key.split('-');
        return {
          record_id: recordId,
          category,
          item,
          rating,
          created_at: new Date().toISOString()
        };
      });

      if (resultEntries.length > 0) {
        const { error: resultsError } = await supabase
          .from('test_results')
          .insert(resultEntries);

        if (resultsError) {
          console.error('保存新测试结果失败:', resultsError);
          throw resultsError;
        }
      }

      console.log('测试记录更新成功:', recordId);
      return updatedRecord[0];
    } catch (error) {
      console.error('更新测试记录时发生错误:', error);
      throw new Error('更新测试记录失败: ' + (error.message || '未知错误'));
    }
  },

  // 批量删除测试记录
  async batchDeleteTestRecords(recordIds, userId) {
    console.log('正在批量删除测试记录:', { recordIds, userId });
    try {
      let successful = 0;
      let failed = 0;
      const errors = [];

      for (const recordId of recordIds) {
        try {
          await this.deleteTestRecord(recordId, userId);
          successful++;
        } catch (error) {
          failed++;
          errors.push({ recordId, error: error.message });
          console.error(`删除记录 ${recordId} 失败:`, error);
        }
      }

      return {
        successful,
        failed,
        errors,
        total: recordIds.length
      };
    } catch (error) {
      console.error('批量删除测试记录时发生错误:', error);
      throw new Error('批量删除失败: ' + (error.message || '未知错误'));
    }
  },

  // 验证测试数据
  validateTestData({ userId, nickname, testType, ratings, reportData }) {
    const errors = [];

    // 验证用户ID
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      errors.push('用户ID不能为空');
    }

    // 验证测试类型
    if (!testType || typeof testType !== 'string' || testType.trim() === '') {
      errors.push('测试类型不能为空');
    }

    // 验证评分数据
    if (!ratings || typeof ratings !== 'object') {
      errors.push('评分数据格式不正确');
    } else {
      // 验证评分值
      const validRatings = ['SSS', 'SS', 'S', 'Q', 'N', 'W', ''];
      for (const [key, value] of Object.entries(ratings)) {
        if (!validRatings.includes(value)) {
          errors.push(`无效的评分值: ${key} = ${value}`);
        }
        if (!key.includes('-')) {
          errors.push(`无效的评分键格式: ${key}`);
        }
      }
    }

    // 验证报告数据
    if (reportData && typeof reportData !== 'object') {
      errors.push('报告数据格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // 获取用户测试统计信息
  async getUserTestStats(userId) {
    console.log('正在获取用户测试统计:', userId);
    try {
      const { data: records, error } = await supabase
        .from('test_records')
        .select('test_type, created_at')
        .eq('user_id_text', userId);

      if (error) {
        console.error('获取测试统计失败:', error);
        throw error;
      }

      const stats = {
        totalTests: records.length,
        testTypes: {},
        firstTestDate: null,
        lastTestDate: null
      };

      if (records.length > 0) {
        // 统计各类型测试数量
        records.forEach(record => {
          stats.testTypes[record.test_type] = (stats.testTypes[record.test_type] || 0) + 1;
        });

        // 获取首次和最近测试时间
        const dates = records.map(r => new Date(r.created_at)).sort((a, b) => a - b);
        stats.firstTestDate = dates[0];
        stats.lastTestDate = dates[dates.length - 1];
      }

      return stats;
    } catch (error) {
      console.error('获取用户测试统计时发生错误:', error);
      throw new Error('获取测试统计失败: ' + (error.message || '未知错误'));
    }
  }
};

// 图库相关的数据库操作
export const galleryApi = {
  // 存储引用
  storage: supabase.storage,

  // 获取图片列表
  async getImages(limit = 20, offset = 0) {
    console.log('正在获取图片列表:', { limit, offset });
    try {
      const { data, error, count } = await supabase
        .from('gallery_images')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('获取图片列表失败:', error);
        throw error;
      }

      const images = data || [];

      let imagesWithCounts = images;
      let countsEnriched = false;
      if (images.length > 0) {
        try {
          const imageIds = images.map(img => img.id);
          const { data: votesData, error: votesError } = await supabase
            .from('gallery_votes')
            .select('image_id, is_like')
            .in('image_id', imageIds);

          if (votesError) {
            console.error('获取图片投票数据失败:', votesError);
          } else {
            const voteCountMap = imageIds.reduce((acc, id) => {
              acc[id] = { likes: 0, dislikes: 0 };
              return acc;
            }, {});

            votesData?.forEach(vote => {
              const bucket = voteCountMap[vote.image_id];
              if (!bucket) return;
              if (vote.is_like) {
                bucket.likes += 1;
              } else {
                bucket.dislikes += 1;
              }
            });

            imagesWithCounts = images.map(img => ({
              ...img,
              likes_count: voteCountMap[img.id]?.likes ?? img.likes ?? 0,
              dislikes_count: voteCountMap[img.id]?.dislikes ?? img.dislikes ?? 0,
            }));
            countsEnriched = true;
          }
        } catch (votesFetchError) {
          console.error('处理图片投票数据时发生错误:', votesFetchError);
        }
      }

      if (!countsEnriched) {
        imagesWithCounts = images.map(img => ({
          ...img,
          likes_count: img.likes ?? 0,
          dislikes_count: img.dislikes ?? 0,
        }));
      }

      return {
        data: imagesWithCounts,
        count: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('获取图片列表时发生错误:', error);
      throw new Error('获取图片列表失败: ' + (error.message || '未知错误'));
    }
  },

  // 上传图片
  async uploadImage(file, userId, metadata = {}, onProgress) {
    console.log('正在上传图片:', { userId, metadata });
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const progressCallback = typeof onProgress === 'function'
        ? (event) => {
            if (!event || !event.total) {
              onProgress(0, event);
              return;
            }
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent, event);
          }
        : undefined;

      // 上传文件到存储
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, {
          onUploadProgress: progressCallback
        });

      if (uploadError) {
        console.error('文件上传失败:', uploadError);
        throw uploadError;
      }

      if (typeof onProgress === 'function') {
        onProgress(100);
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // 保存图片信息到数据库
      const { data: dbData, error: dbError } = await supabase
        .from('gallery_images')
        .insert([{
          user_id: userId,
          image_path: filePath,
          image_url: urlData.publicUrl,
          title: metadata.title || '',
          description: metadata.description || '',
          created_at: new Date().toISOString()
        }])
        .select();

      if (dbError) {
        console.error('保存图片信息失败:', dbError);
        throw dbError;
      }

      console.log('图片上传成功:', dbData[0]);
      return { success: true, data: dbData[0] };
    } catch (error) {
      console.error('上传图片时发生错误:', error);
      throw new Error('上传图片失败: ' + (error.message || '未知错误'));
    }
  },

  // 批量上传图片
  async uploadImages(files, userId, metadata = {}, onProgress) {
    console.log('正在批量上传图片:', { fileCount: files.length, userId });
    const results = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const metadataForFile = Array.isArray(metadata) ? (metadata[i] || {}) : metadata;
        const progressHandler = typeof onProgress === 'function'
          ? (progress, event) => onProgress(progress, i, event)
          : undefined;
        const result = await this.uploadImage(files[i], userId, metadataForFile, progressHandler);
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  },

  // 删除图片
  async deleteImage(imageId, userId, isAdmin = false) {
    console.log('正在删除图片:', { imageId, userId, isAdmin });
    try {
      // 首先获取图片信息
      const { data: imageData, error: fetchError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('获取图片信息失败:', fetchError);
        throw fetchError;
      }

      // 检查权限
      if (!isAdmin && imageData.user_id !== userId) {
        throw new Error('您没有权限删除此图片');
      }

      // 从存储中删除文件
      if (imageData.image_path) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([imageData.image_path]);

        if (storageError) {
          console.error('删除存储文件失败:', storageError);
        }
      }

      // 从数据库中删除记录
      const { error: deleteError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('删除数据库记录失败:', deleteError);
        throw deleteError;
      }

      console.log('图片删除成功:', imageId);
      return { success: true };
    } catch (error) {
      console.error('删除图片时发生错误:', error);
      throw new Error('删除图片失败: ' + (error.message || '未知错误'));
    }
  },

  // 批量删除图片
  async deleteImages(imageIds, userId) {
    console.log('正在批量删除图片:', { imageIds, userId });
    let successful = 0;
    let failed = 0;

    for (const imageId of imageIds) {
      try {
        await this.deleteImage(imageId, userId, true); // 假设批量删除有管理员权限
        successful++;
      } catch (error) {
        console.error(`删除图片 ${imageId} 失败:`, error);
        failed++;
      }
    }

    return { successful, failed };
  },

  // 更新图片信息
  async updateImageInfo(imageId, userId, info, isAdmin = false) {
    console.log('正在更新图片信息:', { imageId, userId, info, isAdmin });
    try {
      // 检查权限
      if (!isAdmin) {
        const { data: imageData, error: fetchError } = await supabase
          .from('gallery_images')
          .select('user_id')
          .eq('id', imageId)
          .single();

        if (fetchError) throw fetchError;
        if (imageData.user_id !== userId) {
          throw new Error('您没有权限编辑此图片');
        }
      }

      const { data, error } = await supabase
        .from('gallery_images')
        .update(info)
        .eq('id', imageId)
        .select();

      if (error) {
        console.error('更新图片信息失败:', error);
        throw error;
      }

      console.log('图片信息更新成功:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('更新图片信息时发生错误:', error);
      throw new Error('更新图片信息失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取图片投票状态
  async getImageVoteStatus(imageId, userId) {
    try {
      const { data, error } = await supabase
        .from('gallery_votes')
        .select('is_like')
        .eq('image_id', imageId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误
        console.error('获取投票状态失败:', error);
        return null;
      }

      return data ? data.is_like : null;
    } catch (error) {
      console.error('获取投票状态时发生错误:', error);
      return null;
    }
  },

  // 更新图片点赞/点踩
  async updateImageLikes(imageId, userId, isLike) {
    console.log('正在更新图片投票:', { imageId, userId, isLike });
    try {
      // 检查是否已经投过票
      const { data: existingVote, error: checkError } = await supabase
        .from('gallery_votes')
        .select('*')
        .eq('image_id', imageId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingVote) {
        // 如果已经投过相同的票，则取消投票
        if (existingVote.is_like === isLike) {
          const { error: deleteError } = await supabase
            .from('gallery_votes')
            .delete()
            .eq('image_id', imageId)
            .eq('user_id', userId);

          if (deleteError) throw deleteError;
          return { action: 'removed' };
        } else {
          // 如果投的是不同的票，则更新
          const { error: updateError } = await supabase
            .from('gallery_votes')
            .update({ is_like: isLike })
            .eq('image_id', imageId)
            .eq('user_id', userId);

          if (updateError) throw updateError;
          return { action: 'changed' };
        }
      } else {
        // 如果没有投过票，则添加新投票
        const { error: insertError } = await supabase
          .from('gallery_votes')
          .insert([{
            image_id: imageId,
            user_id: userId,
            is_like: isLike,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
        return { action: 'added' };
      }
    } catch (error) {
      console.error('更新图片投票时发生错误:', error);
      throw new Error('更新投票失败: ' + (error.message || '未知错误'));
    }
  },

  // 管理员更新投票数
  async adminUpdateVotes(imageId, likes, dislikes) {
    console.log('管理员正在更新投票数:', { imageId, likes, dislikes });
    try {
      // 删除现有投票
      const { error: deleteError } = await supabase
        .from('gallery_votes')
        .delete()
        .eq('image_id', imageId);

      if (deleteError) throw deleteError;

      // 添加新的点赞
      const likeVotes = Array(likes).fill().map(() => ({
        image_id: imageId,
        user_id: 'admin',
        is_like: true,
        created_at: new Date().toISOString()
      }));

      // 添加新的点踩
      const dislikeVotes = Array(dislikes).fill().map(() => ({
        image_id: imageId,
        user_id: 'admin',
        is_like: false,
        created_at: new Date().toISOString()
      }));

      const allVotes = [...likeVotes, ...dislikeVotes];

      if (allVotes.length > 0) {
        const { error: insertError } = await supabase
          .from('gallery_votes')
          .insert(allVotes);

        if (insertError) throw insertError;
      }

      return { success: true };
    } catch (error) {
      console.error('管理员更新投票数时发生错误:', error);
      throw new Error('更新投票数失败: ' + (error.message || '未知错误'));
    }
  },

  // 置顶图片
  async pinImage(imageId) {
    console.log('正在置顶图片:', imageId);
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .update({ is_pinned: true })
        .eq('id', imageId)
        .select();

      if (error) {
        console.error('置顶图片失败:', error);
        throw error;
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('置顶图片时发生错误:', error);
      throw new Error('置顶图片失败: ' + (error.message || '未知错误'));
    }
  },

  // 审核图片
  async approveImage(imageId, isApproved) {
    console.log('正在审核图片:', { imageId, isApproved });
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .update({ is_approved: isApproved })
        .eq('id', imageId)
        .select();

      if (error) {
        console.error('审核图片失败:', error);
        throw error;
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('审核图片时发生错误:', error);
      throw new Error('审核图片失败: ' + (error.message || '未知错误'));
    }
  }
};

export default messagesApi;

// 测试编号管理相关的数据库操作
export const testNumberingApi = {
  // 获取指定测试类型的当前编号
  async getCurrentNumber(testType) {
    console.log('获取当前编号:', testType);
    try {
      const { data, error } = await supabase
        .from('test_type_counters')
        .select('current_number, start_number')
        .eq('test_type', testType)
        .single();

      if (error) {
        console.error('获取当前编号失败:', error);
        throw error;
      }

      if (!data) {
        console.warn('未找到测试类型:', testType);
        return { current: 0, start: 0 };
      }

      return {
        current: data.current_number || 0,
        start: data.start_number || 0
      };
    } catch (error) {
      console.error('获取当前编号时发生错误:', error);
      throw new Error('获取编号失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取下一个编号（原子操作）
  async getNextNumber(testType) {
    console.log('获取下一个编号:', testType);
    try {
      // 使用事务来确保原子性
      const { data, error } = await supabase
        .rpc('increment_test_counter', { test_type_input: testType });

      if (error) {
        console.error('获取下一个编号失败:', error);
        throw error;
      }

      console.log('成功获取下一个编号:', data);
      return data;
    } catch (error) {
      console.error('获取下一个编号时发生错误:', error);
      throw new Error('获取编号失败: ' + (error.message || '未知错误'));
    }
  },

  // 初始化测试类型计数器（如果不存在）
  async initializeCounter(testType, startNumber = 1) {
    console.log('初始化计数器:', testType, startNumber);
    try {
      const { data, error } = await supabase
        .from('test_type_counters')
        .upsert({
          test_type: testType,
          current_number: startNumber,
          start_number: startNumber
        }, {
          onConflict: 'test_type'
        })
        .select();

      if (error) {
        console.error('初始化计数器失败:', error);
        throw error;
      }

      console.log('计数器初始化成功:', data[0]);
      return data[0];
    } catch (error) {
      console.error('初始化计数器时发生错误:', error);
      throw new Error('初始化计数器失败: ' + (error.message || '未知错误'));
    }
  },

  // 重置指定测试类型的计数器
  async resetCounter(testType, newStartNumber = 1) {
    console.log('重置计数器:', testType, newStartNumber);
    try {
      const { data, error } = await supabase
        .from('test_type_counters')
        .update({
          current_number: newStartNumber,
          start_number: newStartNumber
        })
        .eq('test_type', testType)
        .select();

      if (error) {
        console.error('重置计数器失败:', error);
        throw error;
      }

      console.log('计数器重置成功:', data[0]);
      return data[0];
    } catch (error) {
      console.error('重置计数器时发生错误:', error);
      throw new Error('重置计数器失败: ' + (error.message || '未知错误'));
    }
  },

  // 获取所有测试类型的计数器状态
  async getAllCounters() {
    console.log('获取所有计数器状态');
    try {
      const { data, error } = await supabase
        .from('test_type_counters')
        .select('*')
        .order('test_type');

      if (error) {
        console.error('获取计数器状态失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取计数器状态时发生错误:', error);
      throw new Error('获取计数器状态失败: ' + (error.message || '未知错误'));
    }
  },

  // 验证计数器状态
  async validateCounters() {
    console.log('验证计数器状态');
    try {
      const counters = await this.getAllCounters();
      const validation = {
        valid: true,
        issues: [],
        summary: {}
      };

      const expectedTypes = ['female', 'male', 's', 'lgbt'];
      
      for (const testType of expectedTypes) {
        const counter = counters.find(c => c.test_type === testType);
        
        if (!counter) {
          validation.valid = false;
          validation.issues.push(`缺少测试类型: ${testType}`);
          validation.summary[testType] = 'missing';
        } else if (counter.current_number < counter.start_number) {
          validation.valid = false;
          validation.issues.push(`当前编号小于起始编号: ${testType}`);
          validation.summary[testType] = 'invalid';
        } else {
          validation.summary[testType] = {
            current: counter.current_number,
            start: counter.start_number,
            next: counter.current_number + 1
          };
        }
      }

      return validation;
    } catch (error) {
      console.error('验证计数器状态时发生错误:', error);
      throw new Error('验证计数器状态失败: ' + (error.message || '未知错误'));
    }
  }
};
