/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  theme: {
    extend: {
      colors: {
        // 点点开黑品牌色
        primary: '#FFB800',        // 品牌黄（主色）
        'primary-dark': '#E6A000',  // 深黄（hover）
        'primary-light': '#FFF5D6', // 浅黄（背景）
        secondary: '#FF6B8A',       // 品牌粉（辅助色）
        'secondary-light': '#FFE4EB',// 浅粉
        accent: '#8B5A2B',          // 品牌棕（LOGO轮廓色）
        'accent-light': '#D4A574',    // 浅棕
        success: '#52C41A',
        warning: '#FAAD14',
        danger: '#F5222D',
        bg: '#FFFBF0',              // 暖色背景（米黄）
        surface: '#FFFFFF',         // 卡片表面
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}