// 全局消息盒子插件
(function(global) {
  let box = null, timer = null;
  const icons = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle'
  };
  
  // 主题配置
  const themes = {
    info: {
      gradient: 'from-blue-400 via-cyan-400 to-blue-500',
      glow: 'shadow-blue-400/50',
      border: 'border-blue-400/30',
      icon: 'text-blue-400',
      bg: 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-600/20',
      bgSolid: 'bg-blue-500/10'
    },
    success: {
      gradient: 'from-emerald-400 via-green-400 to-emerald-500',
      glow: 'shadow-emerald-400/50',
      border: 'border-emerald-400/30',
      icon: 'text-emerald-400',
      bg: 'bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-600/20',
      bgSolid: 'bg-emerald-500/10'
    },
    warning: {
      gradient: 'from-yellow-400 via-orange-400 to-yellow-500',
      glow: 'shadow-yellow-400/50',
      border: 'border-yellow-400/30',
      icon: 'text-yellow-400',
      bg: 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-600/20',
      bgSolid: 'bg-yellow-500/10'
    },
    error: {
      gradient: 'from-red-400 via-pink-400 to-red-500',
      glow: 'shadow-red-400/50',
      border: 'border-red-400/30',
      icon: 'text-red-400',
      bg: 'bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-600/20',
      bgSolid: 'bg-red-500/10'
    }
  };

  function createBox() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'global-message-box';
    box.style.display = 'none';
    box.style.position = 'fixed';
    box.style.top = '0';
    box.style.left = '0';
    box.style.right = '0';
    box.style.zIndex = '9999';
    box.style.pointerEvents = 'none';
    document.body.appendChild(box);
    return box;
  }

  function show(options) {
    const { message, type = 'info', duration = 4000, onClose } = options;
    const theme = themes[type] || themes.info;
    
    // 创建消息盒子
    const messageBox = document.createElement('div');
    messageBox.className = `
      relative mx-auto max-w-md min-w-[320px] p-6 rounded-2xl backdrop-blur-xl border-2 
      ${theme.border} ${theme.bg} transform transition-all duration-500 
      translate-y-[-100%] opacity-0 shadow-2xl ${theme.glow}
    `;
    
    // 添加炫光效果
    messageBox.innerHTML = `
      <!-- 炫光背景效果 -->
      <div class="absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-15 rounded-2xl"></div>
      <div class="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br ${theme.gradient} opacity-25 rounded-full blur-xl -translate-y-10 -translate-x-10"></div>
      <div class="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br ${theme.gradient} opacity-25 rounded-full blur-xl translate-y-8 translate-x-8"></div>
      <div class="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br ${theme.gradient} opacity-20 rounded-full blur-lg -translate-y-6 -translate-x-6"></div>
      
      <!-- 边框发光效果 -->
      <div class="absolute inset-0 rounded-2xl bg-gradient-to-r ${theme.gradient} opacity-20 blur-sm"></div>
      
      <!-- 内容 -->
      <div class="relative z-10 flex items-start space-x-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br ${theme.accent} rounded-xl flex items-center justify-center shadow-lg border border-white/20">
            <i class="fa ${icons[type]} text-white text-lg"></i>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold ${theme.text} mb-2">
            ${type === 'info' ? '信息' : type === 'success' ? '成功' : type === 'warning' ? '警告' : '错误'}
          </h3>
          <p class="${theme.text} text-base leading-relaxed font-medium">${message}</p>
        </div>
        <button class="flex-shrink-0 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
          <i class="fa fa-times text-gray-300 hover:text-white text-sm"></i>
        </button>
      </div>
      
      <!-- 底部装饰条 -->
      <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} rounded-b-2xl opacity-60"></div>
    `;
    
    const container = createBox();
    container.appendChild(messageBox);
    container.style.display = 'block';
    
    // 显示动画
    requestAnimationFrame(() => {
      messageBox.classList.remove('translate-y-[-100%]', 'opacity-0');
      messageBox.classList.add('translate-y-0', 'opacity-100');
    });
    
    // 关闭函数
    const close = () => {
      messageBox.classList.remove('translate-y-0', 'opacity-100');
      messageBox.classList.add('translate-y-[-100%]', 'opacity-0');
      
      setTimeout(() => {
        if (container.contains(messageBox)) {
          container.removeChild(messageBox);
        }
        if (container.children.length === 0) {
          container.style.display = 'none';
        }
        if (onClose) onClose();
      }, 500);
    };
    
    // 绑定关闭按钮
    const closeBtn = messageBox.querySelector('button');
    closeBtn.addEventListener('click', close);
    
    // 自动关闭
    if (duration > 0) {
      timer = setTimeout(close, duration);
    }
    
    // 鼠标悬停暂停自动关闭
    messageBox.addEventListener('mouseenter', () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
    
    messageBox.addEventListener('mouseleave', () => {
      if (duration > 0) {
        timer = setTimeout(close, duration);
      }
    });
    
    return { close };
  }

  // 暴露到全局
  global.MessageBox = { show };
})(window); 