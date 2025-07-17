import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端实例
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('环境变量缺失：', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('缺少 Supabase 环境变量配置')
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 图片上传相关的API操作
export const galleryApi = {
  // 获取所有图片
  async getImages(limit = 20, offset = 0) {
    console.log('正在获取图片列表...', { limit, offset });
    try {
      const { data, error, count } = await supabase
        .from('report_images')
        .select('*', { count: 'exact' })
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('获取图片列表失败:', error);
        throw error;
      }

      // 确保返回的数据是有效的
      if (!data) {
        console.log('没有找到图片数据');
        return { data: [], count: 0, hasMore: false };
      }

      // 为每个图片添加公共URL（如果没有的话）
      const processedData = data.map(image => {
        if (!image.image_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(image.image_path);
          return { ...image, image_url: publicUrl };
        }
        return image;
      });

      console.log('成功获取图片列表:', {
        totalCount: count,
        returnedCount: processedData.length,
        offset,
        limit,
        hasMore: offset + limit < count
      });

      return { 
        data: processedData, 
        count,
        hasMore: offset + limit < count
      };
    } catch (error) {
      console.error('获取图片列表时发生错误:', error);
      throw new Error('获取图片列表失败: ' + (error.message || '未知错误'));
    }
  },

  // 上传图片到Storage
  async uploadImage(file, userId, metadata = {}, onProgress) {
    if (!file) {
      throw new Error('请选择要上传的图片');
    }

    // 检查文件类型
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      throw new Error('仅支持JPG、PNG、GIF和WebP格式的图片');
    }

    // 检查文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('图片大小不能超过5MB');
    }

    try {
      console.log('开始上传图片:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId: userId
      });

      // 生成文件路径和唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      console.log('准备上传文件:', {
        filePath,
        fileType: file.type,
        bucketName: 'gallery'
      });

      // 直接上传文件
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('上传文件失败:', uploadError);
        throw new Error('上传文件失败: ' + uploadError.message);
      }

      console.log('文件上传成功:', uploadData);

      // 获取公共URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('获取公共URL失败:', urlError);
        throw new Error('获取公共URL失败');
      }

      console.log('获取到公共URL:', publicUrl);

      // 在数据库中记录图片信息
      console.log('准备保存图片信息到数据库:', {
        userId,
        filePath,
        publicUrl,
        metadata
      });

      const { data: imageData, error: dbError } = await supabase
        .from('report_images')
        .insert([
          {
            user_id: userId,
            image_path: filePath,
            image_url: publicUrl,
            title: metadata.title || file.name,
            description: metadata.description || '',
            is_approved: false
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('保存图片信息失败:', dbError);
        // 尝试删除已上传的文件
        await supabase.storage.from('gallery').remove([filePath]);
        throw new Error('保存图片信息失败: ' + dbError.message);
      }

      console.log('图片信息保存成功:', imageData);

      if (onProgress) {
        onProgress(100);
      }

      return imageData;
    } catch (error) {
      console.error('上传图片过程中发生错误:', error);
      throw new Error('上传图片失败: ' + (error.message || '未知错误'));
    }
  },

  // 批量上传图片（仅供管理员使用）
  async uploadImages(files, userId, metadataArray = [], onProgress) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('请选择要上传的图片');
    }

    const results = [];
    const total = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const metadata = metadataArray[i] || {};

        try {
          console.log(`开始上传第 ${i + 1}/${total} 张图片:`, {
            fileName: file.name,
            metadata
          });

          const result = await this.uploadImage(file, userId, metadata, (progress) => {
            // 传递当前文件的索引和进度
            if (onProgress) {
              onProgress(progress, i);
            }
          });

          results.push({ success: true, data: result });
          console.log(`第 ${i + 1} 张图片上传成功`);
        } catch (error) {
          console.error(`第 ${i + 1} 张图片上传失败:`, error);
          results.push({ success: false, error: error.message });
          
          // 即使失败也要通知进度更新
          if (onProgress) {
            onProgress(100, i);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('批量上传过程中发生错误:', error);
      throw new Error('批量上传失败: ' + (error.message || '未知错误'));
    }
  },

  // 删除图片
  async deleteImage(imageId, userId, isAdmin = false) {
    console.log('开始删除图片:', { imageId, userId, isAdmin });
    
    try {
      // 1. 先获取图片信息
      const { data: image, error: fetchError } = await supabase
        .from('report_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('获取图片信息失败:', fetchError);
        throw new Error('获取图片信息失败: ' + fetchError.message);
      }

      if (!image) {
        throw new Error('图片不存在');
      }

      console.log('获取到图片信息:', image);

      // 2. 删除存储中的文件
      if (image.image_path) {
        console.log('正在删除存储文件:', image.image_path);
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([image.image_path]);

      if (storageError) {
          console.error('删除存储文件失败:', storageError);
          // 继续执行数据库记录的删除
        }
      }

      // 3. 删除数据库记录
      console.log('正在删除数据库记录');
      const { error: deleteError } = await supabase
        .from('report_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('删除数据库记录失败:', deleteError);
        
        // 如果是权限错误，尝试使用 RPC
        if (deleteError.message.includes('permission') || deleteError.code === '42501') {
          console.log('尝试使用 RPC 删除...');
          const { error: rpcError } = await supabase.rpc('delete_report_image', {
            p_image_id: imageId
          });
          
          if (rpcError) {
            console.error('RPC 删除失败:', rpcError);
            throw new Error('删除失败: ' + rpcError.message);
          }
        } else {
          throw new Error('删除失败: ' + deleteError.message);
        }
      }

      // 4. 验证删除结果
      const { data: checkData } = await supabase
        .from('report_images')
        .select('id')
        .eq('id', imageId)
        .maybeSingle();

      if (checkData) {
        console.error('警告：记录仍然存在！尝试强制删除');
        
        // 尝试使用原始 SQL 删除
        const { error: sqlError } = await supabase.rpc('force_delete_image', {
          image_id: imageId
        });

        if (sqlError) {
          console.error('强制删除失败:', sqlError);
          throw new Error('无法删除记录，请联系管理员');
        }
      }

      console.log('删除操作完成');
      return true;
    } catch (error) {
      console.error('删除图片时发生错误:', error);
      throw error;
    }
  },

  // 更新图片信息
  async updateImageInfo(imageId, userId, updates, isAdmin = false) {
    try {
      // 检查图片是否存在并验证权限
      const { data: image, error: fetchError } = await supabase
        .from('report_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('获取图片信息失败:', fetchError);
        throw new Error('获取图片信息失败');
      }

      if (!isAdmin && image.user_id !== userId) {
        throw new Error('您没有权限更新此图片信息');
      }

      // 更新图片信息
      const { data, error } = await supabase
        .from('report_images')
        .update(updates)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        console.error('更新图片信息失败:', error);
        throw new Error('更新图片信息失败: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('更新图片信息时发生错误:', error);
      throw new Error('更新图片信息失败: ' + (error.message || '未知错误'));
    }
  },
  
  // 审核图片（管理员操作）
  async approveImage(imageId, isApproved = true) {
    try {
      const { data, error } = await supabase
        .from('report_images')
        .update({ is_approved: isApproved })
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        console.error('审核图片失败:', error);
        throw new Error('审核图片失败: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('审核图片时发生错误:', error);
      throw new Error('审核图片失败: ' + (error.message || '未知错误'));
    }
  },

  // 批量删除图片（仅供管理员使用）
  async deleteImages(imageIds, userId) {
    console.log('开始批量删除图片:', { imageIds, userId });
    
    let successful = 0;
    let failed = 0;
    
    try {
      const results = await Promise.allSettled(
        imageIds.map(async (imageId) => {
          try {
            await this.deleteImage(imageId, userId, true); // 使用 this.deleteImage 而不是 deleteImage
            return { success: true, imageId };
          } catch (error) {
            console.error(`删除图片 ${imageId} 失败:`, error);
            return { success: false, imageId, error: error.message };
          }
        })
      );
      
      successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      failed = results.length - successful;
      
      console.log('批量删除完成:', { successful, failed });
      return { successful, failed };
    } catch (error) {
      console.error('批量删除过程中发生错误:', error);
      throw new Error('批量删除失败: ' + (error.message || '未知错误'));
    }
  },

  // 更新图片的点赞数（管理员专用）
  async adminUpdateVotes(imageId, likesCount, dislikesCount) {
    try {
      const { data, error } = await supabase
        .rpc('admin_update_vote_count', {
          p_image_id: imageId,
          p_likes_count: likesCount,
          p_dislikes_count: dislikesCount
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新点赞数失败:', error);
      throw new Error('更新点赞数失败: ' + error.message);
    }
  },

  // 检查用户24小时内的点赞次数
  async checkUserReactionLimit(userId) {
    if (userId === 'admin') return true;
    
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('image_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo);

      if (error) throw error;
      return count < 50;
    } catch (error) {
      console.error('检查点赞限制失败:', error);
      throw new Error('检查点赞限制失败: ' + error.message);
    }
  },

  // 更新图片的点赞状态
  async updateImageLikes(imageId, userId, isLike) {
    try {
      // 检查用户点赞限制
      if (userId !== 'admin') {
        const canReact = await this.checkUserReactionLimit(userId);
        if (!canReact) {
          throw new Error('您在24小时内的点赞次数已达到上限(50次)');
        }
      }

      // 检查是否已经对这张图片进行过操作
      const { data: existingVote } = await supabase
        .from('image_votes')
        .select('*')
        .eq('image_id', imageId)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        // 如果已经有投票记录
        if (existingVote.is_like === isLike) {
          // 如果点击的是相同的按钮，则取消投票
          await supabase
            .from('image_votes')
            .delete()
            .eq('image_id', imageId)
            .eq('user_id', userId);

          // 更新图片的赞/踩计数
          await supabase.rpc(isLike ? 'decrement_likes' : 'decrement_dislikes', {
            image_id: imageId
          });

          return { action: 'removed' };
        } else {
          // 如果点击的是不同的按钮，则更新投票
          await supabase
            .from('image_votes')
            .update({ is_like: isLike })
            .eq('image_id', imageId)
            .eq('user_id', userId);

          // 更新图片的赞/踩计数
          if (isLike) {
            await supabase.rpc('increment_likes', { image_id: imageId });
            await supabase.rpc('decrement_dislikes', { image_id: imageId });
          } else {
            await supabase.rpc('increment_dislikes', { image_id: imageId });
            await supabase.rpc('decrement_likes', { image_id: imageId });
          }

          return { action: 'changed' };
        }
      } else {
        // 如果没有投票记录，则创建新的投票
        await supabase
          .from('image_votes')
          .insert([
            {
              image_id: imageId,
              user_id: userId,
              is_like: isLike,
              created_at: new Date().toISOString()
            }
          ]);

        // 更新图片的赞/踩计数
        await supabase.rpc(isLike ? 'increment_likes' : 'increment_dislikes', {
          image_id: imageId
        });

        return { action: 'added' };
      }
    } catch (error) {
      console.error('更新点赞状态失败:', error);
      throw error;
    }
  },

  // 获取用户对图片的投票状态
  async getImageVoteStatus(imageId, userId) {
    try {
      const { data: vote } = await supabase
        .from('image_votes')
        .select('is_like')
        .eq('image_id', imageId)
        .eq('user_id', userId)
        .single();

      return vote ? vote.is_like : null;
    } catch (error) {
      console.error('获取投票状态失败:', error);
      return null;
    }
  },

  // 置顶图片
  async pinImage(imageId) {
    try {
      const { data: currentImage, error: getError } = await supabase
        .from('report_images')
        .select('is_pinned')
        .eq('id', imageId)
        .single();

      if (getError) throw getError;

      const { error: updateError } = await supabase
        .from('report_images')
        .update({ is_pinned: !currentImage.is_pinned })
        .eq('id', imageId);

      if (updateError) throw updateError;

      return { success: true, is_pinned: !currentImage.is_pinned };
    } catch (error) {
      console.error('置顶图片失败:', error);
      throw error;
    }
  },
}

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

  // 管理员更新反应数量
  async updateReactionCount(messageId, reactionType, count) {
    console.log(`正在更新消息 ${messageId} 的${reactionType === 'likes' ? '点赞' : '点踩'}数量为 ${count}`);
    try {
      if (!messageId) {
        throw new Error('消息ID不能为空');
      }

      if (count < 0) {
        throw new Error('反应数量不能为负数');
      }

      // 检查消息是否存在
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .single();

      if (messageError) {
        console.error('获取消息失败:', messageError);
        throw new Error('获取消息失败');
      }

      if (!message) {
        throw new Error('消息不存在');
      }

      // 首先删除该消息的所有该类型反应
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('is_like', reactionType === 'likes');

      if (deleteError) {
        console.error('删除现有反应失败:', deleteError);
        throw new Error('更新反应数量失败');
      }

      // 如果新的数量大于0，则添加对应数量的反应
      if (count > 0) {
        // 创建要插入的反应数组
        const reactionsToInsert = Array.from({ length: count }, (_, i) => ({
          message_id: messageId,
          user_id: `admin_reaction_${i}`, // 使用特殊的用户ID表示这是管理员创建的
          is_like: reactionType === 'likes',
          created_at: new Date().toISOString()
        }));

        // 批量插入新的反应
        const { error: insertError } = await supabase
          .from('message_reactions')
          .insert(reactionsToInsert);

        if (insertError) {
          console.error('添加新反应失败:', insertError);
          throw new Error('更新反应数量失败');
        }
      }

      console.log(`成功更新${reactionType === 'likes' ? '点赞' : '点踩'}数量为 ${count}`);
      return true;
    } catch (error) {
      console.error(`更新${reactionType === 'likes' ? '点赞' : '点踩'}数量失败:`, error);
      throw new Error(`更新${reactionType === 'likes' ? '点赞' : '点踩'}数量失败: ${error.message || '未知错误'}`);
    }
  }
}