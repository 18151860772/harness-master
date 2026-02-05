/**
 * 线束大师 - 汽车线束设计自动化平台
 * 留言评论功能模块 - 增强版
 */

// ================================================
// 评论状态管理
// ================================================
const CommentsState = {
    comments: [],
    filter: 'all', // all, tech, help, share, other
    searchQuery: '',
    currentPage: 1,
    commentsPerPage: 10,
    selectedTag: null
};

// 表情反应选项
const REACTIONS = ['👍', '❤️', '😄', '🤔', '🚀'];

// 话题标签配置
const TAG_CONFIG = {
    tech: { label: '技术', class: 'tech', icon: '🔧' },
    help: { label: '求助', class: 'help', icon: '❓' },
    share: { label: '分享', class: 'share', icon: '📢' },
    other: { label: '其他', class: 'other', icon: '💬' }
};

// ================================================
// 初始化评论功能
// ================================================
function initComments() {
    loadComments();
    setupEventListeners();
    renderComments();
    updateEmptyState();
}

function setupEventListeners() {
    // 保留原有的筛选器事件（兼容旧代码）
    const filter = document.getElementById('commentsFilter');
    if (filter) {
        filter.addEventListener('change', function() {
            // 映射旧筛选值到新分类
            const mapping = {
                'latest': 'all',
                'popular': 'all',
                'unanswered': 'help'
            };
            filterComments(mapping[this.value] || 'all');
        });
    }
}

// ================================================
// 加载评论
// ================================================
function loadComments() {
    const saved = localStorage.getItem('comments');
    if (saved) {
        CommentsState.comments = JSON.parse(saved);
    } else {
        // 添加示例评论（带话题标签）
        CommentsState.comments = getSampleComments();
        saveComments();
    }
}

function getSampleComments() {
    return [
        {
            id: 'comment_1',
            author: '张工',
            avatar: '张',
            tag: 'help',
            content: '请问在使用线径计算器时，对于高压线束（800V），应该选择什么类型的绝缘材料？',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            likes: 12,
            reactions: { '👍': 5, '❤️': 2, '🤔': 3 },
            pinned: false,
            replies: [
                {
                    id: 'reply_1',
                    author: '线束大师',
                    avatar: 'M',
                    content: '高压线束建议使用交联聚乙烯（XLPE）或聚氟乙烯（FEP）绝缘材料，具有优异的耐高压和耐温性能。',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    isOfficial: true
                }
            ]
        },
        {
            id: 'comment_2',
            author: '李明',
            avatar: '李',
            tag: 'share',
            content: '分享一个实用技巧：在进行线束三维布局时，使用CATIA的Electrical Harness Design模块可以大大提高设计效率，特别是自动生成展开图功能非常实用。',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            likes: 28,
            reactions: { '👍': 15, '🚀': 8, '😄': 5 },
            pinned: true,
            replies: []
        },
        {
            id: 'comment_3',
            author: '王芳',
            avatar: '王',
            tag: 'tech',
            content: 'LV 214标准和ISO 6722标准的主要区别是什么？在实际设计中应该如何选择？',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            likes: 8,
            reactions: { '🤔': 4 },
            pinned: false,
            replies: []
        },
        {
            id: 'comment_4',
            author: '陈工程师',
            avatar: '陈',
            tag: 'tech',
            content: '关于BOM自动生成功能，建议大家在导出前一定要仔细核对物料编码，最近发现自动生成偶尔会把相同规格不同供应商的物料搞混。',
            timestamp: new Date(Date.now() - 28800000).toISOString(),
            likes: 15,
            reactions: { '👍': 10, '😄': 2 },
            pinned: false,
            replies: []
        },
        {
            id: 'comment_5',
            author: '赵工',
            avatar: '赵',
            tag: 'share',
            content: '今天测试了新上线的仿真分析工具，感觉热分析功能很强大，特别是温升计算和散热路径分析，对于优化线束布置很有帮助。',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            likes: 22,
            reactions: { '👍': 18, '🚀': 5 },
            pinned: false,
            replies: []
        }
    ];
}

function saveComments() {
    localStorage.setItem('comments', JSON.stringify(CommentsState.comments));
}

// ================================================
// 分类筛选
// ================================================
window.filterComments = function(tab) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    CommentsState.filter = tab;
    CommentsState.currentPage = 1;
    renderComments();
    updateEmptyState();
};

// ================================================
// 搜索评论
// ================================================
window.searchComments = function(query) {
    CommentsState.searchQuery = query.trim().toLowerCase();
    renderComments();
    updateEmptyState();
};

// ================================================
// 话题标签选择
// ================================================
window.selectTag = function(btn) {
    // 移除其他标签的选中状态
    document.querySelectorAll('.comment-tag').forEach(tag => {
        tag.classList.remove('selected');
    });

    // 切换当前标签的选中状态
    const tag = btn.dataset.tag;
    if (CommentsState.selectedTag === tag) {
        CommentsState.selectedTag = null; // 取消选择
    } else {
        btn.classList.add('selected');
        CommentsState.selectedTag = tag;
    }
};

// ================================================
// 渲染评论列表
// ================================================
function renderComments() {
    const container = document.getElementById('commentsList');
    if (!container) return;

    // 根据筛选和搜索条件过滤
    const filteredComments = getFilteredComments();

    // 分页
    const startIndex = (CommentsState.currentPage - 1) * CommentsState.commentsPerPage;
    const paginatedComments = filteredComments.slice(startIndex, startIndex + CommentsState.commentsPerPage);

    if (paginatedComments.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = paginatedComments.map(comment => createCommentHTML(comment)).join('');

    // 添加动画
    container.querySelectorAll('.comment-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`;
    });
}

function getFilteredComments() {
    let comments = [...CommentsState.comments];

    // 按分类筛选
    if (CommentsState.filter !== 'all') {
        comments = comments.filter(c => c.tag === CommentsState.filter);
    }

    // 搜索过滤
    if (CommentsState.searchQuery) {
        comments = comments.filter(c =>
            c.content.toLowerCase().includes(CommentsState.searchQuery) ||
            c.author.toLowerCase().includes(CommentsState.searchQuery)
        );
    }

    // 排序：置顶优先，然后按时间
    comments.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return comments;
}

function updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const commentsList = document.getElementById('commentsList');

    if (!emptyState || !commentsList) return;

    const filteredComments = getFilteredComments();

    if (filteredComments.length === 0) {
        emptyState.style.display = 'flex';
        commentsList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        commentsList.style.display = 'block';
    }
}

function createCommentHTML(comment) {
    const timeAgo = formatTimeAgo(comment.timestamp);
    const tagInfo = TAG_CONFIG[comment.tag] || TAG_CONFIG.other;
    const repliesHTML = comment.replies && comment.replies.length > 0
        ? `<div class="comment-replies">${comment.replies.map(reply => createReplyHTML(reply)).join('')}</div>`
        : '';

    // 检查用户是否已点赞
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    const isLiked = likedComments.includes(comment.id);

    // 获取用户对该评论的反应
    const userReactions = JSON.parse(localStorage.getItem('userReactions') || '{}');
    const userReaction = userReactions[comment.id] || null;

    // 计算总反应数
    const totalReactions = Object.values(comment.reactions || {}).reduce((sum, count) => sum + count, 0);

    return `
        <div class="comment-item ${comment.pinned ? 'pinned' : ''}" data-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-avatar">${comment.avatar}</div>
                <div class="comment-info">
                    <span class="comment-author">${escapeHtml(comment.author)}</span>
                    <span class="comment-time">${timeAgo}</span>
                    <span class="comment-tag-badge ${tagInfo.class}">${tagInfo.icon} ${tagInfo.label}</span>
                    ${comment.pinned ? '<span class="pinned-badge"><i class="fas fa-thumbtack"></i> 置顶</span>' : ''}
                </div>
                ${isAdminUser() ? getAdminActionsHTML(comment.id, comment.pinned) : ''}
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="comment-actions">
                <button class="comment-action ${isLiked ? 'liked' : ''}" onclick="likeComment('${comment.id}')">
                    <i class="fas fa-heart"></i>
                    <span>${comment.likes}</span>
                </button>
                <button class="comment-action" onclick="showReactions('${comment.id}')">
                    ${getReactionsHTML(comment.reactions)}
                    ${totalReactions > 0 ? `<span class="count">${totalReactions}</span>` : ''}
                </button>
                <button class="comment-action" onclick="replyToComment('${comment.id}')">
                    <i class="fas fa-reply"></i>
                    <span>${comment.replies ? comment.replies.length : 0}</span>
                </button>
                <button class="comment-action" onclick="shareComment('${comment.id}')">
                    <i class="fas fa-share"></i>
                </button>
            </div>
            ${getReactionsBar(comment.id, userReaction)}
            ${repliesHTML}
        </div>
    `;
}

function createReplyHTML(reply) {
    const timeAgo = formatTimeAgo(reply.timestamp);
    const officialBadge = reply.isOfficial ? '<span class="official-badge">官方</span>' : '';

    return `
        <div class="reply-item" data-id="${reply.id}">
            <div class="reply-avatar">${reply.avatar}</div>
            <div class="reply-content">
                <div class="reply-header">
                    <span class="reply-author">${escapeHtml(reply.author)}</span>
                    ${officialBadge}
                    <span class="reply-time">${timeAgo}</span>
                </div>
                <div class="reply-text">${escapeHtml(reply.content)}</div>
            </div>
        </div>
    `;
}

function getAdminActionsHTML(commentId, isPinned) {
    return `
        <div class="admin-actions">
            <button class="admin-btn pin-btn" onclick="togglePinComment('${commentId}')" title="${isPinned ? '取消置顶' : '置顶'}">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="admin-btn delete-btn" onclick="deleteComment('${commentId}')" title="删除">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

function getReactionsHTML(reactions) {
    if (!reactions || Object.keys(reactions).length === 0) return '<span>👍</span>';

    return Object.entries(reactions)
        .filter(([emoji, count]) => count > 0)
        .map(([emoji, count]) => `<span>${emoji}</span>`)
        .slice(0, 3)
        .join('');
}

function getReactionsBar(commentId, currentReaction) {
    return `
        <div class="comment-reactions">
            ${REACTIONS.map(emoji => `
                <button class="reaction-btn ${currentReaction === emoji ? 'active' : ''}"
                        onclick="addReaction('${commentId}', '${emoji}')">
                    ${emoji}
                    <span class="count"></span>
                </button>
            `).join('')}
        </div>
    `;
}

// ================================================
// 提交评论
// ================================================
window.submitComment = function() {
    const input = document.getElementById('commentInput');
    const content = input ? input.value.trim() : '';

    if (!content) {
        showToast('请输入评论内容', 'warning');
        return;
    }

    if (content.length < 10) {
        showToast('评论内容至少需要10个字符', 'warning');
        return;
    }

    // 获取当前用户信息
    const currentUser = JSON.parse(localStorage.getItem('harness-master-user') || 'null');
    const username = currentUser?.username || '访客用户';
    const userAvatar = username.charAt(0).toUpperCase();

    const comment = {
        id: 'comment_' + Date.now(),
        author: username,
        avatar: userAvatar,
        tag: CommentsState.selectedTag || 'other',
        content: content,
        timestamp: new Date().toISOString(),
        likes: 0,
        reactions: {},
        pinned: false,
        replies: []
    };

    CommentsState.comments.unshift(comment);
    saveComments();

    // 清空输入框
    if (input) {
        input.value = '';
    }

    // 清除选中的标签
    document.querySelectorAll('.comment-tag').forEach(tag => {
        tag.classList.remove('selected');
    });
    CommentsState.selectedTag = null;

    // 重新渲染
    renderComments();
    updateEmptyState();

    showToast('评论发布成功！', 'success');

    // 滚动到新评论
    const newComment = document.querySelector(`.comment-item[data-id="${comment.id}"]`);
    if (newComment) {
        newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newComment.classList.add('highlight');
        setTimeout(() => newComment.classList.remove('highlight'), 2000);
    }
};

// ================================================
// 评论操作
// ================================================
window.likeComment = function(commentId) {
    const comment = CommentsState.comments.find(c => c.id === commentId);
    if (!comment) return;

    // 检查用户是否已点赞
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    const isLiked = likedComments.includes(commentId);

    if (isLiked) {
        comment.likes = Math.max(0, comment.likes - 1);
        const newLiked = likedComments.filter(id => id !== commentId);
        localStorage.setItem('likedComments', JSON.stringify(newLiked));
    } else {
        comment.likes++;
        likedComments.push(commentId);
        localStorage.setItem('likedComments', JSON.stringify(likedComments));
    }

    saveComments();
    renderComments();
};

window.addReaction = function(commentId, emoji) {
    const comment = CommentsState.comments.find(c => c.id === commentId);
    if (!comment) return;

    // 获取用户当前反应
    const userReactions = JSON.parse(localStorage.getItem('userReactions') || '{}');
    const previousReaction = userReactions[commentId];

    // 初始化 reactions
    if (!comment.reactions) {
        comment.reactions = {};
    }

    // 移除之前的反应
    if (previousReaction) {
        comment.reactions[previousReaction] = Math.max(0, (comment.reactions[previousReaction] || 1) - 1);
    }

    // 添加或切换反应
    if (previousReaction === emoji) {
        // 取消反应
        delete userReactions[commentId];
    } else {
        // 添加新反应
        comment.reactions[emoji] = (comment.reactions[emoji] || 0) + 1;
        userReactions[commentId] = emoji;
    }

    localStorage.setItem('userReactions', JSON.stringify(userReactions));
    saveComments();
    renderComments();
};

window.showReactions = function(commentId) {
    // 聚焦到反应栏
    const reactionsBar = document.querySelector(`.comment-item[data-id="${commentId}"] .comment-reactions`);
    if (reactionsBar) {
        reactionsBar.scrollIntoView({ behavior: 'smooth' });
    }
};

window.replyToComment = function(commentId) {
    const comment = CommentsState.comments.find(c => c.id === commentId);
    if (!comment) return;

    // 聚焦到评论输入框并添加引用
    const input = document.getElementById('commentInput');
    if (input) {
        input.focus();
        input.placeholder = `回复 @${comment.author}：`;
        input.dataset.replyTo = commentId;
        input.scrollIntoView({ behavior: 'smooth' });
    }
};

window.shareComment = function(commentId) {
    const comment = CommentsState.comments.find(c => c.id === commentId);
    if (!comment) return;

    // 复制分享链接
    const shareUrl = window.location.href + '#comment-' + commentId;
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('分享链接已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('分享链接：' + shareUrl, 'info');
    });
};

// ================================================
// 回复功能
// ================================================
window.submitReply = function(commentId) {
    const input = document.getElementById('replyInput_' + commentId);
    const content = input ? input.value.trim() : '';

    if (!content) {
        showToast('请输入回复内容', 'warning');
        return;
    }

    const comment = CommentsState.comments.find(c => c.id === commentId);
    if (!comment) return;

    const reply = {
        id: 'reply_' + Date.now(),
        author: '当前用户',
        avatar: '当',
        content: content,
        timestamp: new Date().toISOString(),
        isOfficial: false
    };

    if (!comment.replies) {
        comment.replies = [];
    }

    comment.replies.push(reply);
    saveComments();
    renderComments();

    showToast('回复发布成功！', 'success');
};

// ================================================
// 管理员功能
// ================================================
function isAdminUser() {
    const currentUser = JSON.parse(localStorage.getItem('harness-master-user') || 'null');
    return currentUser && currentUser.role === 'admin';
}

window.togglePinComment = function(commentId) {
    const comment = CommentsState.comments.find(c => c.id === commentId);
    if (!comment) return;

    comment.pinned = !comment.pinned;
    saveComments();
    renderComments();

    showToast(comment.pinned ? '已置顶该评论' : '已取消置顶', 'success');
};

window.deleteComment = function(commentId) {
    const confirmed = confirm('确定要删除这条评论吗？此操作不可恢复。');
    if (!confirmed) return;

    const index = CommentsState.comments.findIndex(c => c.id === commentId);
    if (index === -1) return;

    CommentsState.comments.splice(index, 1);
    saveComments();
    renderComments();
    updateEmptyState();

    showToast('评论已删除', 'success');
};

window.reportComment = function(commentId) {
    const reasons = ['垃圾信息', '不当言论', '人身攻击', '其他'];
    const reason = prompt('请选择举报原因：\n' + reasons.map((r, i) => `${i + 1}. ${r}`).join('\n'));

    if (reason && parseInt(reason) >= 1 && parseInt(reason) <= 4) {
        const reports = JSON.parse(localStorage.getItem('commentReports') || '[]');
        reports.push({
            commentId: commentId,
            reason: reasons[parseInt(reason) - 1],
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('commentReports', JSON.stringify(reports));

        showToast('举报已提交，我们会尽快处理', 'success');
    }
};

// ================================================
// 格式化时间
// ================================================
function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return '刚刚';
    } else if (diffMins < 60) {
        return `${diffMins} 分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours} 小时前`;
    } else if (diffDays < 7) {
        return `${diffDays} 天前`;
    } else {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================
// 评论统计
// ================================================
function getCommentsStats() {
    const stats = {
        total: CommentsState.comments.length,
        totalLikes: CommentsState.comments.reduce((sum, c) => sum + c.likes, 0),
        totalReplies: CommentsState.comments.reduce((sum, c) => sum + (c.replies ? c.replies.length : 0), 0),
        topAuthors: {},
        topLiked: []
    };

    CommentsState.comments.forEach(c => {
        stats.topAuthors[c.author] = (stats.topAuthors[c.author] || 0) + 1;
    });

    stats.topLiked = [...CommentsState.comments]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5);

    return stats;
}

// ================================================
// 导出评论
// ================================================
window.exportComments = function(format = 'json') {
    const data = JSON.stringify(CommentsState.comments, null, 2);

    if (format === 'json') {
        downloadFile(data, 'comments.json', 'application/json');
    } else if (format === 'csv') {
        const csv = convertToCSV(CommentsState.comments);
        downloadFile(csv, 'comments.csv', 'text/csv');
    }

    showToast('评论数据已导出', 'success');
};

function convertToCSV(comments) {
    const headers = ['ID', '作者', '标签', '内容', '时间', '点赞数', '回复数', '是否置顶'];
    const rows = comments.map(c => [
        c.id,
        c.author,
        c.tag || 'other',
        `"${c.content.replace(/"/g, '""')}"`,
        formatTime(c.timestamp),
        c.likes,
        c.replies ? c.replies.length : 0,
        c.pinned ? '是' : '否'
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ================================================
// 初始化（外部调用）
// ================================================
window.initComments = initComments;
