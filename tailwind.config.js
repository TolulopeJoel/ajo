/** Ajo design tokens. Every colour, radius and shadow in the app comes from here. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:    '#141210', // ledger ink — all borders + body text
        paper:  '#F3EADA', // ruled notebook paper — app background
        card:   '#FFFDF8', // the page you write on
        adire:  '#3A34C4', // indigo cloth — primary action
        mango:  '#FFB627', // market mango — highlight, "your turn"
        palm:   '#12784F', // clean record
        kola:   '#C81E2B', // missed contributions
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { chunk: '18px', pill: '999px' },
      boxShadow: {
        stamp: '5px 6px 0 0 #141210',
        stampsm: '3px 4px 0 0 #141210',
        stamplg: '8px 9px 0 0 #141210',
        press: '1px 1px 0 0 #141210',
      },
      keyframes: {
        stampin: {
          '0%':   { transform: 'scale(1.7) rotate(-9deg)', opacity: '0' },
          '55%':  { transform: 'scale(0.93) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        rowflash: {
          '0%':   { backgroundColor: '#FFB627' },
          '100%': { backgroundColor: 'transparent' },
        },
        tick: { '0%,100%': { transform: 'rotate(0deg)' }, '50%': { transform: 'rotate(360deg)' } },
        dots: { '0%,100%': { opacity: '0.25' }, '50%': { opacity: '1' } },
      },
      animation: {
        stampin: 'stampin 420ms cubic-bezier(.2,1.4,.4,1) both',
        rowflash: 'rowflash 1400ms ease-out both',
        dots: 'dots 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
