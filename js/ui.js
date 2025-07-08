console.log('UI.js loaded');
class UIManager {
    constructor(app) {
        this.app = app;
        this.isAnimating = false;
        this.cacheElements();
        this.initEventListeners();
    }

    cacheElements() {
        this.elements = {
            // User info displays
            userEmail: document.getElementById('userEmail'),
            userEmailPopup: document.getElementById('userEmailPopup'),
            
            // Plan status displays
            userPlan: document.getElementById('userPlan'),
            userPlanPopup: document.getElementById('userPlanPopup'),
            proBadge: document.getElementById('proBadge'),
            
            // Usage displays
            usageIndicator: document.getElementById('usageIndicator'),
            usageCount: document.getElementById('usageCount'),
            usageBar: document.getElementById('usageBar'),
            
            // Auth components
            accountInfoPopup: document.getElementById('accountInfoPopup'),
            accountActions: document.getElementById('accountActions'),
            signInForm: document.getElementById('signInForm'),
            signUpForm: document.getElementById('signUpForm'),
            overlay: document.getElementById('overlay'),
            
            // Side panel elements
            sidePanel: document.getElementById('sidePanel'),
            collapsedSidebar: document.getElementById('collapsedSidebar'),
            mainContent: document.getElementById('mainContent'),
            
            // Modals
            pricingModal: document.getElementById('pricingModal'),
            knowledgeModal: document.getElementById('knowledgeModal'),
            knowledgeText: document.getElementById('knowledgeText'),
            
            // Chat elements
            emptyState: document.getElementById('emptyState'),
            chatContainer: document.getElementById('chatContainer')
        };
    }

    initEventListeners() {
        // Add overlay click handler to close modals
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', () => {
                this.closeAllModals();
            });
        }
    }

    closeAllModals() {
        this.hidePricingModal();
        this.hideKnowledgeModal();
    }

    updateUI() {
        if (!this.elements) return;

        // Debug current state
        console.log('Updating UI with:', {
            user: this.app.user,
            isPro: this.app.hasActiveSubscription,
            messages: this.app.todayMessages
        });

        // Update email displays
        this.updateText('userEmail', this.app.user?.email || 'Not signed in');
        this.updateText('userEmailPopup', this.app.user?.email || 'Not signed in');

        if (this.app.user) {
            // User is logged in
            this.toggleVisibility('accountInfoPopup', true);
            this.toggleVisibility('accountActions', true);
            this.toggleVisibility('signInForm', false);
            this.toggleVisibility('signUpForm', false);

            // Update plan status
            const isPro = this.app.hasActiveSubscription;
            const planText = isPro ? 'Pro Plan' : 'Free Plan';
            
            this.updateText('userPlan', planText);
            this.updateText('userPlanPopup', planText);
            
            // Toggle pro badges
            this.toggleVisibility('proBadge', isPro);
            
        } else {
            // User is not logged in
            this.toggleVisibility('accountInfoPopup', false);
            this.toggleVisibility('accountActions', false);
            
            // Show appropriate auth forms
            if (this.app.authManager) {
                this.app.authManager.showSignInForm();
            }
            
            // Set default to Free Plan
            this.updateText('userPlan', 'Free Plan');
            this.updateText('userPlanPopup', 'Free Plan');
            
            // Hide all pro indicators
            this.toggleVisibility('proBadge', false);
            this.toggleVisibility('usageIndicator', true);
        }
    }

    toggleSidePanel() {
        if (!this.elements.sidePanel || !this.elements.collapsedSidebar || !this.elements.mainContent) return;
        
        // Debounce check
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        if (this.elements.sidePanel.classList.contains('hidden')) {
            // Opening the panel
            this.elements.sidePanel.classList.remove('hidden');
            this.elements.collapsedSidebar.classList.add('hidden');
            this.elements.mainContent.classList.remove('main-content-collapsed');
            this.elements.mainContent.classList.add('main-content-expanded');
        } else {
            // Closing the panel
            this.elements.sidePanel.classList.add('hidden');
            this.elements.collapsedSidebar.classList.remove('hidden');
            this.elements.mainContent.classList.remove('main-content-expanded');
            this.elements.mainContent.classList.add('main-content-collapsed');
        }
        
        // Reset animation state after transition
        const transitionEndHandler = () => {
            this.elements.sidePanel.removeEventListener('transitionend', transitionEndHandler);
            this.isAnimating = false;
        };
        
        this.elements.sidePanel.addEventListener('transitionend', transitionEndHandler);
    }

    closeSidePanel() {
        if (!this.elements.sidePanel || !this.elements.collapsedSidebar || !this.elements.mainContent) return;
        
        if (!this.elements.sidePanel.classList.contains('hidden')) {
            this.elements.sidePanel.classList.add('hidden');
            this.elements.collapsedSidebar.classList.remove('hidden');
            this.elements.mainContent.classList.remove('main-content-expanded');
            this.elements.mainContent.classList.add('main-content-collapsed');
        }
    }

    showPricingModal() {
        if (!this.elements.pricingModal) return;
        
        this.elements.pricingModal.classList.remove('hidden');
        
        // Trigger animation
        setTimeout(() => {
            this.elements.pricingModal.classList.add('animate-fade-in');
        }, 10);
        
        if (this.app.authManager) {
            this.app.authManager.closeAccountPopup();
        }
    }

    hidePricingModal() {
        if (!this.elements.pricingModal) return;
        
        this.elements.pricingModal.classList.remove('animate-fade-in');
        this.elements.pricingModal.classList.add('animate-fade-out');
        
        // Delay hiding to allow animation to complete
        setTimeout(() => {
            this.elements.pricingModal.classList.add('hidden');
            this.elements.pricingModal.classList.remove('animate-fade-out');
        }, 300);
    }

    showKnowledgeModal() {
        if (!this.elements.knowledgeModal || !this.elements.knowledgeText) return;
        
        this.elements.knowledgeModal.classList.remove('hidden');
        this.elements.knowledgeText.value = this.app.knowledge || '';
        
        // Trigger animation
        setTimeout(() => {
            this.elements.knowledgeModal.classList.add('animate-fade-in');
        }, 10);
    }

    hideKnowledgeModal() {
        if (!this.elements.knowledgeModal) return;
        
        this.elements.knowledgeModal.classList.remove('animate-fade-in');
        this.elements.knowledgeModal.classList.add('animate-fade-out');
        
        // Delay hiding to allow animation to complete
        setTimeout(() => {
            this.elements.knowledgeModal.classList.add('hidden');
            this.elements.knowledgeModal.classList.remove('animate-fade-out');
        }, 300);
    }

    showEmptyState() {
        if (!this.elements.emptyState || !this.elements.chatContainer) return;
        
        this.elements.emptyState.classList.remove('hidden');
        this.elements.chatContainer.classList.add('hidden');
    }

    hideEmptyState() {
        if (!this.elements.emptyState || !this.elements.chatContainer) return;
        
        this.elements.emptyState.classList.add('hidden');
        this.elements.chatContainer.classList.remove('hidden');
    }

    displayMessage(role, content) {
        if (!this.elements.chatContainer) return;
        
        this.hideEmptyState();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `message-bubble ${role === 'user' ? 'user-message' : 'ai-message'}`;
        
        // Format content with proper line breaks and links
        let formattedContent = content
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:underline">$1</a>')
            .replace(/\n/g, '<br>');
        
        bubbleDiv.innerHTML = formattedContent;
        messageDiv.appendChild(bubbleDiv);
        
        this.elements.chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }

    showTypingIndicator() {
        if (!this.elements.chatContainer) return;
        
        this.hideEmptyState();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-start';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble ai-message';
        
        bubbleDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messageDiv.appendChild(bubbleDiv);
        this.elements.chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }

    removeTypingIndicator() {
        if (!this.elements.chatContainer) return;
        
        const typingIndicators = this.elements.chatContainer.querySelectorAll('.typing-indicator');
        typingIndicators.forEach(indicator => {
            indicator.parentElement.parentElement.remove();
        });
    }

    // Helper methods
    updateText(elementKey, text) {
        const element = this.elements[elementKey];
        if (element) element.textContent = text;
    }

    toggleVisibility(elementKey, isVisible) {
        const element = this.elements[elementKey];
        if (element) element.classList.toggle('hidden', !isVisible);
    }
}