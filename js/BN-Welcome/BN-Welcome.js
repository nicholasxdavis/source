// welcome-popup.js
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase client
    const SUPABASE_URL = 'https://zxeikhguvghtsqouyuyz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWlraGd1dmdodHNxb3V5dXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODYyMzAsImV4cCI6MjA2NzE2MjIzMH0.a9jWr_h1dgyi_ST7sgKDASDHi7hkMjSWOR78Vq2fMN0';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check if welcome should be shown
    if (!await shouldShowWelcome(supabase)) {
        return;
    }

    // Create the welcome popup HTML
    const welcomePopupHTML = `
        <div id="welcomePopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none">
            <div class="bg-[#252526] rounded-lg w-full max-w-4xl h-[80vh] max-h-[700px] flex flex-col border border-[#454545] overflow-hidden transform scale-95 transition-transform duration-300">
                <!-- Header -->
                <div class="flex justify-between items-center p-4 border-b border-[#454545] bg-[#1E1E1E]">
                    <h2 class="text-lg font-medium text-[#CCCCCC]">Welcome to Sourcere</h2>
                    <button id="closeWelcomeBtn" class="text-[#CCCCCC] hover:text-white p-1 rounded hover:bg-[#3A3D41]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                <!-- Main Content -->
                <div class="flex flex-1 overflow-hidden">
                    <!-- Left Sidebar (like VS Code activity bar) -->
                    <div class="w-16 bg-[#1E1E1E] flex flex-col items-center py-4 border-r border-[#454545]">
                        <div class="w-full flex flex-col items-center space-y-6">
                            <button class="welcome-tab active p-3 text-blue-400" data-tab="start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </button>
                            <button class="welcome-tab p-3 text-[#CCCCCC] hover:text-white" data-tab="recent">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button class="welcome-tab p-3 text-[#CCCCCC] hover:text-white" data-tab="help">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content Area -->
                    <div class="flex-1 flex flex-col overflow-hidden">
                        <!-- Tab Content -->
                        <div id="welcomeContent" class="flex-1 overflow-y-auto p-6">
                            <!-- Start Tab -->
                            <div id="startTab" class="welcome-tab-content active">
                                <div class="flex items-center mb-8">
                                    <div>
                                        <h1 class="text-2xl font-bold mb-1">Sourcere AI</h1>
                                        <p class="text-[#A0A0A0]">AI-Powered Resource Guide Generator</p>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div class="p-5 bg-[#2D2D2D] rounded-lg border border-[#454545] hover:border-blue-500 transition-colors cursor-pointer" id="newGuideBtn">
                                        <div class="flex items-center mb-3">
                                            <div class="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <h3 class="font-medium">New Guide</h3>
                                        </div>
                                        <p class="text-sm text-[#A0A0A0]">Start with a blank guide and generate resources for any topic</p>
                                    </div>
                                    
                                    <div class="p-5 bg-[#2D2D2D] rounded-lg border border-[#454545] hover:border-blue-500 transition-colors cursor-pointer" id="openDocsBtn">
                                        <div class="flex items-center mb-3">
                                            <div class="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 class="font-medium">Documentation</h3>
                                        </div>
                                        <p class="text-sm text-[#A0A0A0]">Learn how to get the most out of Sourcere</p>
                                    </div>
                                </div>
                                
                                <div class="mb-8">
                                    <h3 class="text-lg font-medium mb-4 text-[#CCCCCC]">Quick Start</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-start">
                                            <div class="bg-[#0078D4] text-white text-xs font-medium px-2 py-1 rounded mr-3 mt-1">1</div>
                                            <div>
                                                <p class="font-medium">Enter your topic</p>
                                                <p class="text-sm text-[#A0A0A0]">Type any topic in the input field at the bottom of the screen</p>
                                            </div>
                                        </div>
                                        <div class="flex items-start">
                                            <div class="bg-[#0078D4] text-white text-xs font-medium px-2 py-1 rounded mr-3 mt-1">2</div>
                                            <div>
                                                <p class="font-medium">Generate resources</p>
                                                <p class="text-sm text-[#A0A0A0]">Click the generate button or press Enter to create your guide</p>
                                            </div>
                                        </div>
                                        <div class="flex items-start">
                                            <div class="bg-[#0078D4] text-white text-xs font-medium px-2 py-1 rounded mr-3 mt-1">3</div>
                                            <div>
                                                <p class="font-medium">Save or export</p>
                                                <p class="text-sm text-[#A0A0A0]">Save your guide or export it as PDF for future reference</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="border-t border-[#454545] pt-6">
                                    <h3 class="text-lg font-medium mb-4 text-[#CCCCCC]">Recent Updates</h3>
                                    <ul class="space-y-3 text-sm">
                                        <li class="flex items-start">
                                            <span class="text-blue-400 mr-2">•</span>
                                            <span>Improved AI model for more accurate resource recommendations</span>
                                        </li>
                                        <li class="flex items-start">
                                            <span class="text-blue-400 mr-2">•</span>
                                            <span>Added PDF export functionality</span>
                                        </li>
                                        <li class="flex items-start">
                                            <span class="text-blue-400 mr-2">•</span>
                                            <span>New dark theme with better contrast</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Recent Tab -->
                            <div id="recentTab" class="welcome-tab-content hidden">
                                <h3 class="text-lg font-medium mb-6 text-[#CCCCCC]">Recent Guides</h3>
                                <div id="recentGuidesList" class="space-y-3">
                                    <p class="text-[#A0A0A0]">No recent guides yet. Create your first guide to see them here.</p>
                                </div>
                            </div>
                            
                            <!-- Help Tab -->
                            <div id="helpTab" class="welcome-tab-content hidden">
                                <h3 class="text-lg font-medium mb-6 text-[#CCCCCC]">Help & Resources</h3>
                                <div class="space-y-6">
                                    <div>
                                        <h4 class="font-medium mb-3">Getting Started</h4>
                                        <ul class="space-y-2 text-sm">
                                            <li class="flex items-center text-blue-400 hover:underline cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                <span>Sourcere Documentation</span>
                                            </li>
                                            <li class="flex items-center text-blue-400 hover:underline cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Frequently Asked Questions</span>
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h4 class="font-medium mb-3">Support</h4>
                                        <ul class="space-y-2 text-sm">
                                            <li class="flex items-center text-blue-400 hover:underline cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>Contact Support</span>
                                            </li>
                                            <li class="flex items-center text-blue-400 hover:underline cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                                <span>Community Forum</span>
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h4 class="font-medium mb-3">Feedback</h4>
                                        <ul class="space-y-2 text-sm">
                                            <li class="flex items-center text-blue-400 hover:underline cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Submit Feedback</span>
                                            </li>
                                            <li class="flex items-center text-blue-400 hover:underline cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                <span>Request a Feature</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="p-4 border-t border-[#454545] bg-[#1E1E1E] flex justify-between items-center">
                            <div class="flex items-center space-x-4">
                                <button id="showWhatsNewBtn" class="text-sm text-[#CCCCCC] hover:text-white flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>What's New</span>
                                </button>
                                <button id="showWelcomeTourBtn" class="text-sm text-[#CCCCCC] hover:text-white flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Take a Tour</span>
                                </button>
                            </div>
                            <div class="flex items-center">
                                <label class="flex items-center text-sm text-[#CCCCCC] cursor-pointer">
                                    <input type="checkbox" id="dontShowAgainCheckbox" class="mr-2 rounded border-[#454545] bg-[#2D2D2D]">
                                    <span>Don't show again</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add the popup to the body
    document.body.insertAdjacentHTML('beforeend', welcomePopupHTML);

    // Add styles for the welcome popup
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            #welcomePopup > div {
                width: 85% !important;
                height: 85vh !important;
                max-height: 85vh !important;
                border-radius: 0.75rem !important;
            }

            #welcomePopup .text-sm {
                font-size: 0.65rem !important;
            }
        }
        .welcome-tab.active {
            background-color: rgba(30, 30, 30, 0.6);
            border-left: 2px solid #0078D4;
        }
        
        .welcome-tab-content {
            display: none;
        }
        
        .welcome-tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        #welcomePopup.active {
            opacity: 1;
            pointer-events: auto;
        }
        
        #welcomePopup.active > div {
            transform: scale(1);
        }
    `;
    document.head.appendChild(style);

    // Show the popup
    const welcomePopup = document.getElementById('welcomePopup');
    setTimeout(() => {
        welcomePopup.classList.add('active');
    }, 100);

    // Tab switching functionality
    const tabs = document.querySelectorAll('.welcome-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active', 'text-blue-400'));
            tabs.forEach(t => t.classList.add('text-[#CCCCCC]'));
            tab.classList.add('active', 'text-blue-400');
            tab.classList.remove('text-[#CCCCCC]');
            
            // Show corresponding content
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.welcome-tab-content').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}Tab`).classList.remove('hidden');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    // Close button - updated to work with has_seen_welcome only
    document.getElementById('closeWelcomeBtn').addEventListener('click', async () => {
        const welcomePopup = document.getElementById('welcomePopup');
        welcomePopup.classList.remove('active');
        setTimeout(() => {
            welcomePopup.remove();
            style.remove();
        }, 300);
        
        // Check if "Don't show again" is checked
        const dontShowAgain = document.getElementById('dontShowAgainCheckbox').checked;
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // Update user profile to mark welcome as seen
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    has_seen_welcome: true
                });
            
            if (error) {
                console.error('Error updating welcome status:', error);
            }
            
            // If "Don't show again" is checked, set localStorage flag too
            if (dontShowAgain) {
                localStorage.setItem('sourcere_hide_welcome', 'true');
            }
        } else {
            // For anonymous users, just use localStorage
            if (dontShowAgain) {
                localStorage.setItem('sourcere_hide_welcome', 'true');
            }
        }
    });

    // New guide button
    document.getElementById('newGuideBtn').addEventListener('click', () => {
        const welcomePopup = document.getElementById('welcomePopup');
        welcomePopup.classList.remove('active');
        setTimeout(() => {
            welcomePopup.remove();
            style.remove();
        }, 300);
    });

    // Overlay click to close
    const welcomePopupElement = document.getElementById('welcomePopup');
    welcomePopupElement.addEventListener('click', (e) => {
        if (e.target === welcomePopupElement) {
            welcomePopupElement.classList.remove('active');
            setTimeout(() => {
                welcomePopupElement.remove();
                style.remove();
            }, 300);
        }
    });

    // Load recent guides if any
    const loadRecentGuides = () => {
        const recentGuidesList = document.getElementById('recentGuidesList');
        try {
            const chats = JSON.parse(localStorage.getItem('sourcere_chats')) || [];
            if (chats.length > 0) {
                recentGuidesList.innerHTML = '';
                chats.slice(0, 5).forEach(chat => {
                    const guideItem = document.createElement('div');
                    guideItem.className = 'p-3 bg-[#2D2D2D] rounded-lg border border-[#454545] hover:border-blue-500 transition-colors cursor-pointer';
                    guideItem.innerHTML = `
                        <div class="flex justify-between items-center">
                            <h4 class="font-medium truncate">${chat.title || 'Untitled Guide'}</h4>
                            <span class="text-xs text-[#A0A0A0]">${new Date(chat.createdAt).toLocaleDateString()}</span>
                        </div>
                    `;
                    guideItem.addEventListener('click', () => {
                        const welcomePopup = document.getElementById('welcomePopup');
                        welcomePopup.classList.remove('active');
                        setTimeout(() => {
                            welcomePopup.remove();
                            style.remove();
                        }, 300);
                    });
                    recentGuidesList.appendChild(guideItem);
                });
            }
        } catch (e) {
            console.error('Error loading recent guides:', e);
        }
    };

    // Initialize recent guides
    loadRecentGuides();
});

// Check if welcome should be shown - updated to work with has_seen_welcome only
async function shouldShowWelcome(supabase) {
    // First check localStorage
    if (localStorage.getItem('sourcere_hide_welcome')) {
        return false;
    }
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Check user's profile in Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('has_seen_welcome')
            .eq('id', user.id)
            .single();
            
        if (!error && profile && profile.has_seen_welcome) {
            return false;
        }
    }
    
    return true;
}

// Function to manually show the welcome popup - updated to reset has_seen_welcome
async function showWelcomePopup() {
    const SUPABASE_URL = 'https://zxeikhguvghtsqouyuyz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWlraGd1dmdodHNxb3V5dXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODYyMzAsImV4cCI6MjA2NzE2MjIzMH0.a9jWr_h1dgyi_ST7sgKDASDHi7hkMjSWOR78Vq2fMN0';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    localStorage.removeItem('sourcere_hide_welcome');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Reset welcome flag in Supabase
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                has_seen_welcome: false
            });
            
        if (error) {
            console.error('Error resetting welcome status:', error);
        }
    }
    
    // Reload the page to show the popup
    window.location.reload();
}

// Make the showWelcomePopup function available globally
window.showWelcomePopup = showWelcomePopup;