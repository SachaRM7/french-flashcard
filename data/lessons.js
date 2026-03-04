// Lessons structure for HelloArabic - Conversations with levels
window.LESSONS_DATA = [
    {
        id: 'traditions-1-1',
        themeId: 'traditions-1',
        themeName: 'Traditions 1',
        number: 1,
        title: 'Are you American?',
        description: 'Sam meets a border agent at the airport and is questioned by him.',
        level: 'B1',
        playCount: 111398,
        coverUrl: 'https://via.placeholder.com/400x250?text=Traditions+1',
        duration: '7:59',
        dialogue: [
            {
                speaker: 'A',
                ar: 'مَرْحَبًا!',
                en: 'Hi!',
                fr: 'Salut!'
            },
            {
                speaker: 'B',
                ar: 'مَرْحَبًا! أَنْتَ أَمِيرِكِيّ؟',
                en: 'Hi! Are you American?',
                fr: 'Salut! Tu es Américain?'
            },
            {
                speaker: 'A',
                ar: 'نَعَمْ.',
                en: 'Yes.',
                fr: 'Oui.'
            },
            {
                speaker: 'B',
                ar: 'مَرْحَبًا بِكَ فِي الْأُرْدُنّ!',
                en: 'Welcome to Jordan!',
                fr: 'Bienvenue en Jordanie!'
            }
        ],
        vocabulary: ['مرحبا', 'أمريكي', 'نعم', 'الأردن'],
        grammar: ['Present tense', 'Greetings', 'Nationality'],
        isPopular: true
    },
    {
        id: 'traditions-1-2',
        themeId: 'traditions-1',
        themeName: 'Traditions 1',
        number: 2,
        title: 'I\'m Jordanian.',
        description: 'Sam takes a taxi from Queen Rania airport to his uncle\'s house in Amman.',
        level: 'B1',
        playCount: 89234,
        coverUrl: 'https://via.placeholder.com/400x250?text=Traditions+1+2',
        duration: '8:15',
        dialogue: [],
        vocabulary: [],
        grammar: [],
        isPopular: false
    },
    {
        id: 'traditions-2-1',
        themeId: 'traditions-2',
        themeName: 'Traditions 2',
        number: 1,
        title: 'At the market',
        description: 'Shopping at a local souk in Cairo.',
        level: 'A2',
        playCount: 78456,
        coverUrl: 'https://via.placeholder.com/400x250?text=Traditions+2',
        duration: '6:30',
        dialogue: [],
        vocabulary: [],
        grammar: [],
        isPopular: false
    },
    {
        id: 'traditions-3-1',
        themeId: 'traditions-3',
        themeName: 'Traditions 3',
        number: 1,
        title: 'Family gathering',
        description: 'A typical family visit during Eid celebration.',
        level: 'A1',
        playCount: 65234,
        coverUrl: 'https://via.placeholder.com/400x250?text=Traditions+3',
        duration: '5:45',
        dialogue: [],
        vocabulary: [],
        grammar: [],
        isPopular: false
    }
];

// Helper functions
function countLessonsByLevel(lessons = window.LESSONS_DATA) {
    const counts = { 'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0, 'C1': 0 };
    lessons.forEach(lesson => {
        if (counts.hasOwnProperty(lesson.level)) {
            counts[lesson.level]++;
        }
    });
    return counts;
}

function countLessonsByTheme(lessons = window.LESSONS_DATA) {
    const counts = {};
    lessons.forEach(lesson => {
        if (!counts[lesson.themeId]) {
            counts[lesson.themeId] = 0;
        }
        counts[lesson.themeId]++;
    });
    return counts;
}

function getPopularLesson(lessons = window.LESSONS_DATA) {
    return lessons.find(l => l.isPopular) || lessons[0] || null;
}

function getRecentlyViewed(themeId, lastViewedAt, days = 7) {
    if (!lastViewedAt) return false;
    const last = new Date(lastViewedAt).getTime();
    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000;
    return now - last <= maxAge;
}
