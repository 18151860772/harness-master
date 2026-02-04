/**
 * 线束大师 - 汽车线束设计自动化平台
 * 留言评论功能模块
 */

// ================================================
// 评论状态管理
// ================================================
const CommentsState = {
    comments: [],
    filter: 'latest',
    currentPage: 1,
    commentsPerPage: 10
};

// ================================================
// 初始化评论功能
// ================================================
function initComments() {
    loadComments();
    setupEventListeners();
    renderComments();
}

function setupEventListeners() {
    const filter = document.getElementById('commentsFilter');
    if (filter) {
        filter.addEventListener('change', function() {
            CommentsState.filter = this.value;
            CommentsState.currentPage = 1;
            renderComments();
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
        // 添加示例评论
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
            content: '请问在使用线径计算器时，对于高压线束（800V），应该选择什么类型的绝缘材料？',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            likes: 12,
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
            content: '分享一个实用技巧：在进行线束三维布局时，使用CATIA的Electrical Harness Design模块可以大大提高设计效率，特别是自动生成展开图功能非常实用。',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            likes: 28,
            replies: []
        },
        {
            id: 'comment_3',
            author: '王芳',
            avatar: '王',
            content: '大家好，我是汽车线束设计新手，想请教一下LV 214标准和ISO 6722标准的主要区别是什么？在实际设计中应该如何选择？',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            likes: 8,
            replies: []
        },
        {
            id: 'comment_4',
            author: '陈工程师',
            avatar: '陈',
            content: '关于BOM自动生成功能，建议大家在导出前一定要仔细核对物料编码，最近发现自动生成偶尔会把相同规格不同供应商的物料搞混。',
            timestamp: new Date(Date.now() - 28800000).toISOString(),
            likes: 15,
            replies: []
        },
        {
            id: 'comment_5',
            author: '赵工',
            avatar: '赵',
            content: '今天测试了新上线的仿真分析工具，感觉热分析功能很强大，特别是温升计算和散热路径分析，对于优化线束布置很有帮助。',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            likes: 22,
            replies: []
        }
    ];
}

function saveComments() {
    localStorage.setItem('comments', JSON.stringify(CommentsState.comments));
}

// ================================================
// 渲染评论列表
// ================================================
function renderComments() {
    const container = document.getElementById('commentsList');
    if (!container) return;
    
    // 根据筛选条件排序
    const sortedComments = getSortedComments();
    
    // 分页
    const startIndex = (CommentsState.currentPage - 1) * CommentsState.commentsPerPage;
    const paginatedComments = sortedComments.slice(startIndex, startIndex + CommentsState.commentsPerPage);
    
    if (paginatedComments.length === 0) {
        container.innerHTML = `
            <div class="empty-comments">
                <i class="fas fa-comments"></i>
                <p>暂无评论，快来发表第一条吧！</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = paginatedComments.map(comment => createCommentHTML(comment)).join('');
    
    // 添加动画
    container.querySelectorAll('.comment-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`;
    });
}

function getSortedComments() {
    switch (CommentsState.filter) {
        case 'popular':
            return [...CommentsState.comments].sort((a, b) => b.likes - a.likes);
        case 'unanswered':
            return [...CommentsState.comments].filter(c => c.replies.length === 0)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        case 'latest':
        default:
            return [...CommentsState.comments].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp));
    }
}

function createCommentHTML(comment) {
    const timeAgo = formatTimeAgo(comment.timestamp);
    const repliesHTML = comment.replies && comment.replies.length > 0 
        ? `<div class="comment-replies">${comment.replies.map(reply => createReplyHTML(reply)).join('')}</div>` 
        : '';
    
    return `
        <div class="comment-item" data-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-avatar">${comment.avatar}</div>
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(comment.author)}</span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="comment-actions">
                <span class="comment-action ${comment.liked ? 'liked' : ''}" onclick="likeComment('${comment.id}')">
                    <i class="fas fa-heart"></i>
                    <span>${comment.likes}</span>
                </span>
                <span class="comment-action" onclick="replyToComment('${comment.id}')">
                    <i class="fas fa-reply"></i>
                    <span>${comment.replies ? comment.replies.length : 0}</span>
                </span>
                <span class="comment-action" onclick="shareComment('${comment.id}')">
                    <i class="fas fa-share"></i>
                </span>
            </div>
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
    
    const comment = {
        id: 'comment_' + Date.now(),
        author: '访客用户',
        avatar: '访',
        content: content,
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
    };
    
    CommentsState.comments.unshift(comment);
    saveComments();
    
    // 清空输入框
    if (input) {
        input.value = '';
    }
    
    // 重新渲染
    renderComments();
    
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
    
    // 更新本地存储的点赞状态
    const likeAction = document.querySelector(`.comment-item[data-id="${commentId}"] .comment-action.like-action`);
    if (likeAction) {
        likeAction.classList.toggle('liked', !isLiked);
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
// 删除评论（管理员功能）
// ================================================
window.deleteComment = function(commentId) {
    const confirmed = confirm('确定要删除这条评论吗？');
    if (!confirmed) return;
    
    const index = CommentsState.comments.findIndex(c => c.id ===commentId);
    if (index === -1) return;
    
    CommentsState.comments.splice(index, 1);
    saveComments();
    renderComments();
    
    showToast('评论已删除', 'success');
};

// ================================================
// 举报评论
// ================================================
window.reportComment = function(commentId) {
    const reasons = ['垃圾信息', '不当言论', '人身攻击', '其他'];
    const reason = prompt('请选择举报原因：\n' + reasons.map((r, i) => `${i + 1}. ${r}`).join('\n'));
    
    if (reason && parseInt(reason) >= 1 && parseInt(reason) <= 4) {
        // 保存举报记录
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
    
    // 统计作者
    CommentsState.comments.forEach(c => {
        stats.topAuthors[c.author] = (stats.topAuthors[c.author] || 0) + 1;
    });
    
    // 最受欢迎的评论
    stats.topLiked = [...CommentsState.comments]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5);
    
    return stats;
}

// ================================================
// 搜索评论
// ================================================
window.searchComments = function(query) {
    if (!query.trim()) {
        renderComments();
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = CommentsState.comments.filter(c => 
        c.content.toLowerCase().includes(lowerQuery) ||
        c.author.toLowerCase().includes(lowerQuery)
    );
    
    const container = document.getElementById('commentsList');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-comments">
                <i class="fas fa-search"></i>
                <p>未找到相关评论</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(comment => createCommentHTML(comment)).join('');
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
    const headers = ['ID', '作者', '内容', '时间', '点赞数', '回复数'];
    const rows = comments.map(c => [
        c.id,
        c.author,
        `"${c.content.replace(/"/g, '""')}"`,
        formatTime(c.timestamp),
        c.likes,
        c.replies ? c.replies.length : 0
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