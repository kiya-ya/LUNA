/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  theme: {
    extend: {
      colors: {
        // 点点开黑品牌色（紫金体系，与培训师系统统一）
        primary: '#8E6BC8',        // 品牌紫（主色）
        'primary-dark': '#7451A8',  // 深紫（hover）
        'primary-light': '#EFE7FA', // 浅紫（背景）
        secondary: '#F5B301',       // 品牌金（辅助色）
        'secondary-light': '#FFF3D1',// 浅金
        accent: '#5B2A06',          // 品牌棕（标题/描边）
        'accent-light': '#D4A574',    // 浅棕
        success: '#52C41A',
        warning: '#FAAD14',
        danger: '#F5222D',
        bg: '#F7F3FC',              // 淡紫白背景
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