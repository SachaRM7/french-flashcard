// Conversations Mode Data & Logic

const conversationsData = {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    levelColors: {
        'A1': { bg: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', accent: '#16a34a' },
        'A2': { bg: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', accent: '#1d4ed8' },
        'B1': { bg: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', accent: '#dc2626' },
        'B2': { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', accent: '#d97706' },
        'C1': { bg: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', accent: '#7c3aed' }
    },
    
    series: {
        'A1': [
            {
                id: 'traditions-1',
                title: 'Traditions 1',
                lessons: [
                    {
                        id: 'trad-1-1',
                        num: 1,
                        title: 'Traditions 1 | 1: Are you American?',
                        description: 'Sam meets a border agent at the airport and is questioned by him.',
                        image: 'https://via.placeholder.com/150?text=Traditions+1',
                        progress: 69,
                        duration: '07:59',
                        dialogue: [
                            { speaker: 'A', ar: 'مرحبًا!', en: 'Hi!' },
                            { speaker: 'B', ar: 'مرحبتين! أنت أمريكي؟', en: 'Hi! Are you American?' },
                            { speaker: 'A', ar: 'نعم.', en: 'Yes.' },
                            { speaker: 'B', ar: 'مرحبا بك في الأردن!', en: 'Welcome to Jordan!' }
                        ],
                        vocabulary: [
                            { ar: 'في', trans: '/fi/', en: 'in' },
                            { ar: 'الأردن', trans: '/al-urdunn/', en: 'Jordan' }
                        ],
                        examples: [
                            { ar: 'انت في البيت؟', en: 'Are you at home?' },
                            { ar: 'القلم في جيبي.', en: 'The pen is in my pocket.' },
                            { ar: 'أنا في عمان.', en: 'I am in Amman.' }
                        ],
                        grammar: [
                            { title: 'Subject Pronoun (2nd person masculine sing.)', examples: [
                                { ar: 'انت بريطاني.', en: 'You are British.' },
                                { ar: 'انت قصير.', en: 'You are short.' },
                                { ar: 'انت تعبان', en: 'You are tired.' }
                            ]}
                        ]
                    },
                    {
                        id: 'trad-1-2',
                        num: 2,
                        title: 'Traditions 1 | 2: I\'m Jordanian.',
                        description: 'Sam takes a taxi from Queen Rania airport to his uncle\'s house in Amman.',
                        image: 'https://via.placeholder.com/150?text=Traditions+2',
                        progress: 45,
                        duration: '08:15',
                        dialogue: [],
                        vocabulary: [],
                        examples: [],
                        grammar: []
                    }
                ]
            }
        ]
    }
};

let currentConversationsLevel = 'A1';
let currentLesson = null;
let conversationsSettings = {
    showTranslation: true,
    autoPlay: false,
    currentTab: 'dialogue'
};

function startConversations() {
    showPage('conversationsHomePage');
    renderConversationsHome();
}

function renderConversationsHome() {
    const level = currentConversationsLevel;
    const series = conversationsData.series[level] || [];
    const colors = conversationsData.levelColors[level];
    
    const header = document.getElementById('convHeader');
    header.style.background = colors.bg;
    
    // Render level tabs
    const tabsHtml = conversationsData.levels.map(l => 
        `<button class="conv-level-tab ${l === level ? 'active' : ''}" 
         style="${l === level ? `color: ${conversationsData.levelColors[l].accent}` : ''}"
         onclick="switchConversationsLevel('${l}')">${l}</button>`
    ).join('');
    document.getElementById('convLevelTabs').innerHTML = tabsHtml;
    
    // Render lesson list
    let lessonsHtml = '';
    series.forEach(s => {
        s.lessons.forEach(lesson => {
            const progressText = lesson.progress > 0 ? `<div class="lesson-progress">Terminé à ${lesson.progress}%</div>` : '';
            lessonsHtml += `
                <div class="lesson-item" onclick="openConversationLesson('${lesson.id}')">
                    <img src="${lesson.image}" class="lesson-thumb" alt="${lesson.title}">
                    <div class="lesson-content">
                        <div class="lesson-title">${lesson.title}</div>
                        <div class="lesson-desc">${lesson.description}</div>
                        ${progressText}
                    </div>
                </div>
            `;
        });
    });
    
    document.getElementById('convLessonsList').innerHTML = lessonsHtml;
    if (typeof feather !== 'undefined') feather.replace();
}

function switchConversationsLevel(level) {
    currentConversationsLevel = level;
    renderConversationsHome();
}

function openConversationLesson(lessonId) {
    // Find lesson
    for (let level in conversationsData.series) {
        for (let series of conversationsData.series[level]) {
            const lesson = series.lessons.find(l => l.id === lessonId);
            if (lesson) {
                currentLesson = lesson;
                showPage('conversationLessonPage');
                renderConversationLesson();
                return;
            }
        }
    }
}

function renderConversationLesson() {
    if (!currentLesson) return;
    
    const lesson = currentLesson;
    document.getElementById('convLessonTitle').textContent = lesson.title;
    document.getElementById('convLessonDesc').textContent = lesson.description;
    
    // Render tabs
    renderConversationTab('dialogue');
    
    // Setup controls
    document.getElementById('convShowTranslation').checked = conversationsSettings.showTranslation;
    document.getElementById('convAutoPlay').checked = conversationsSettings.autoPlay;
    
    // Setup player
    document.getElementById('convAudioDuration').textContent = lesson.duration;
}

function switchConversationTab(tab) {
    conversationsSettings.currentTab = tab;
    document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    renderConversationTab(tab);
}

function renderConversationTab(tab) {
    const lesson = currentLesson;
    if (!lesson) return;
    
    const container = document.getElementById('convTabContent');
    let html = '';
    
    if (tab === 'dialogue') {
        html = lesson.dialogue.map(line => `
            <div class="dialogue-line">
                <div class="speaker-label">${line.speaker}</div>
                <div class="dialogue-ar">${line.ar}</div>
                ${conversationsSettings.showTranslation ? `<div class="dialogue-en">${line.en}</div>` : ''}
                <button class="audio-btn" onclick="playDialogueAudio('${line.ar}')"><i data-feather="volume-2"></i></button>
            </div>
        `).join('');
    } else if (tab === 'vocabulary') {
        html = lesson.vocabulary.map(item => `
            <div class="vocab-item">
                <div class="vocab-word">${item.ar}</div>
                <div class="vocab-meta">
                    <div class="vocab-trans">${item.trans}</div>
                    <div class="vocab-en">${item.en}</div>
                </div>
                <div class="vocab-actions">
                    <button class="audio-btn" onclick="playVocabAudio('${item.ar}')"><i data-feather="volume-2"></i></button>
                    <button class="fav-btn" onclick="toggleFav(this)"><i data-feather="heart"></i></button>
                </div>
            </div>
        `).join('');
    } else if (tab === 'examples') {
        html = lesson.examples.map(ex => `
            <div class="example-item">
                <div class="example-ar">${ex.ar}</div>
                ${conversationsSettings.showTranslation ? `<div class="example-en">${ex.en}</div>` : ''}
                <button class="audio-btn" onclick="playExampleAudio('${ex.ar}')"><i data-feather="volume-2"></i></button>
            </div>
        `).join('');
    } else if (tab === 'grammar') {
        html = lesson.grammar.map(gram => `
            <div class="grammar-section">
                <div class="grammar-title">${gram.title}</div>
                ${gram.examples.map(ex => `
                    <div class="grammar-example">
                        <div class="grammar-ar">${ex.ar}</div>
                        ${conversationsSettings.showTranslation ? `<div class="grammar-en">${ex.en}</div>` : ''}
                        <button class="audio-btn" onclick="playGrammarAudio('${ex.ar}')"><i data-feather="volume-2"></i></button>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
    
    container.innerHTML = html;
    feather.replace();
}

function toggleConversationTranslation() {
    conversationsSettings.showTranslation = !conversationsSettings.showTranslation;
    renderConversationTab(conversationsSettings.currentTab);
}

function toggleConversationAutoPlay() {
    conversationsSettings.autoPlay = !conversationsSettings.autoPlay;
}

// Audio playback stubs
function playDialogueAudio(text) { console.log('Play:', text); }
function playVocabAudio(text) { console.log('Play:', text); }
function playExampleAudio(text) { console.log('Play:', text); }
function playGrammarAudio(text) { console.log('Play:', text); }
