// Courses configuration
window.COURSES_DATA = [
    {
        id: 'arabic',
        name: 'العربية',
        nameLocal: 'Arabe',
        flag: '🇸🇦',
        description: 'Apprends l\'arabe coranique et classique',
        color: '#3fb950',
        decksFile: 'data/arabic/decks.js',
        config: {
            frontLang: 'ar-SA',
            backLang: 'fr-FR',
            frontLabel: 'Arabe',
            backLabel: 'Français',
            frontFont: "'Amiri', serif",
            backFont: "'Inter', sans-serif",
            frontDir: 'rtl',
            backDir: 'ltr',
            hasTranslit: true,
            hasDiacritics: true, // Harakats
            frontFontSize: '2.5rem',
            backFontSize: '1.3rem'
        }
    },
    {
        id: 'french',
        name: 'Français',
        nameLocal: 'French',
        flag: '🇫🇷',
        description: 'Learn French from English',
        color: '#58a6ff',
        decksFile: 'data/french/decks.js',
        config: {
            frontLang: 'en-US',
            backLang: 'fr-FR',
            frontLabel: 'English',
            backLabel: 'Français',
            frontFont: "'Inter', sans-serif",
            backFont: "'Inter', sans-serif",
            frontDir: 'ltr',
            backDir: 'ltr',
            hasTranslit: false,
            hasDiacritics: false,
            frontFontSize: '1.5rem',
            backFontSize: '1.5rem'
        }
    }
];
