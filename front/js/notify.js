// 全局通知盒子插件
(function(global) {
  let container = null;
  const icons = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle'
  };
  
  // 主题配置 - 简洁的通知样式
  const themes = {
    info: {
      bg: 'bg-slate-800',
      border: 'border-slate-600',
      icon: 'text-blue-400',
      text: 'text-slate-200',
      accent: 'bg-blue-500/10'
    },
    success: {
      bg: 'bg-emerald-800',
      border: 'border-emerald-600',
      icon: 'text-emerald-400',
      text: 'text-emerald-200',
      accent: 'bg-emerald-500/10'
    },
    warning: {
      bg: 'bg-amber-800',
      border: 'border-amber-600',
      icon: 'text-amber-400',
      text: 'text-amber-200',
      accent: 'bg-amber-500/10'
    },
    error: {
      bg: 'bg-red-800',
      border: 'border-red-600',
      icon: 'text-red-400',
      text: 'text-red-200',
      accent: 'bg-red-500/10'
    }
  };

  // 亮色主题配置
  const lightThemes = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      accent: 'bg-blue-100'
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
      text: 'text-emerald-900',
      accent: 'bg-emerald-100'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      text: 'text-amber-900',
      accent: 'bg-amber-100'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      accent: 'bg-red-100'
    }
  };

  function createContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'global-notify-container';
    container.style.position = 'fixed';
    container.style.top = '32px';
    container.style.right = '32px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '16px';
    document.body.appendChild(container);
    return container;
  }

  function show({ message, type = 'info', duration = 3000, onClose }) {
    
    createContainer();
    
    // 检测当前主题
    const isLightTheme = document.body.classList.contains('theme-light');
    const themeConfig = isLightTheme ? lightThemes : themes;
    const theme = themeConfig[type] || themeConfig.info;
    
    const notify = document.createElement('div');
    notify.className = `relative p-3 rounded-lg border ${theme.border} ${theme.bg} flex items-center gap-2 shadow max-w-xs min-w-[200px]`;
    notify.innerHTML = `
      <div class="flex-shrink-0 w-6 h-6 ${theme.accent} rounded flex items-center justify-center"><i class="fa ${icons[type]} ${theme.icon} text-xs"></i></div>
      <div class="flex-1 min-w-0"><p class="${theme.text} text-xs font-medium leading-snug">${message}</p></div>
      <button class="flex-shrink-0 w-5 h-5 ${isLightTheme ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'} rounded flex items-center justify-center transition-all duration-200"><i class="fa fa-times ${isLightTheme ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-white'} text-xs"></i></button>
    `;
    
    // 初始状态：透明且向右偏移
    notify.style.opacity = '0';
    notify.style.transform = 'translateX(100%) scale(0.95)';
    notify.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    container.appendChild(notify);
    
    
    // 强制重绘后显示动画
    setTimeout(() => {
      notify.style.opacity = '1';
      notify.style.transform = 'translateX(0) scale(1)';
      
    }, 10);
    
    const close = () => {
      
      notify.style.opacity = '0';
      notify.style.transform = 'translateX(100%) scale(0.95)';
      setTimeout(() => {
        if (notify.parentNode) notify.parentNode.removeChild(notify);
        if (typeof onClose === 'function') onClose();
      }, 300);
    };
    
    const closeBtn = notify.querySelector('button');
    closeBtn.addEventListener('click', close);
    
    // 自动关闭
    const autoClose = setTimeout(close, duration);
    
    // 鼠标悬停时暂停自动关闭
    notify.addEventListener('mouseenter', () => { 
      clearTimeout(autoClose); 
    });
    
    notify.addEventListener('mouseleave', () => { 
      setTimeout(close, duration); 
    });
  }

  global.Notify = { show };
})(window); 