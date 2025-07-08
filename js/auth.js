// Configuration
const SUPABASE_URL = 'https://zxeikhguvghtsqouyuyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWlraGd1dmdodHNxb3V5dXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODYyMzAsImV4cCI6MjA2NzE2MjIzMH0.a9jWr_h1dgyi_ST7sgKDASDHi7hkMjSWOR78Vq2fMN0';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51R8vivGrsdJU1djqOmJc552p6sqzKVm1QprLIRalhnaJmie73Hc6Aoj0jVGGJmIxBK1z6HpHIBQYmeVABBEpQS8800wgyGpO4y';

// Initialize clients
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

class AuthManager {
  constructor(app) {
    this.app = app;
    this.paymentLoading = false;
  }

  async initializeAuth() {
    // Set up all auth event listeners
    this.setupAuthEventListeners();

    // Handle auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this.app.session = session;
      this.app.user = session?.user || null;
      
      // Update UI based on auth state
      this.app.uiManager.updateUI();
      this.app.loadUsage();
      
      // Update account popup UI
      this.updateAccountPopupUI();
    });

    // Check for existing session on page load
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return;
    }

    this.app.session = session;
    this.app.user = session?.user || null;
    this.app.uiManager.updateUI();
    this.app.loadUsage();
    this.updateAccountPopupUI();
  }

  setupAuthEventListeners() {
    // Auth form elements
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const showSignUpBtn = document.getElementById('showSignUpBtn');
    const showSignInBtn = document.getElementById('showSignInBtn');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const closeAccountPopupBtn = document.getElementById('closeAccountPopupBtn');
    const upgradeToProBtn = document.getElementById('upgradeToProBtn');

    // Desktop event listeners
    if (signInBtn) signInBtn.addEventListener('click', () => this.handleSignIn());
    if (signUpBtn) signUpBtn.addEventListener('click', () => this.handleSignUp());
    if (showSignUpBtn) showSignUpBtn.addEventListener('click', () => this.showSignUpForm());
    if (showSignInBtn) showSignInBtn.addEventListener('click', () => this.showSignInForm());
    if (upgradeBtn) upgradeBtn.addEventListener('click', () => this.handleUpgrade());
    if (signOutBtn) signOutBtn.addEventListener('click', () => this.handleSignOut());
    if (closeAccountPopupBtn) closeAccountPopupBtn.addEventListener('click', () => this.closeAccountPopup());
    if (upgradeToProBtn) upgradeToProBtn.addEventListener('click', () => this.handleUpgrade());
  }

  updateAccountPopupUI() {
    const accountUserEmail = document.getElementById('accountUserEmail');
    const accountUserPlan = document.getElementById('accountUserPlan');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const accountActions = document.getElementById('accountActions');

    if (this.app.user) {
      // User is logged in
      accountUserEmail.textContent = this.app.user.email;
      accountUserPlan.textContent = this.app.hasActiveSubscription ? 'Pro Plan' : 'Free Plan';
      signInForm.classList.add('hidden');
      signUpForm.classList.add('hidden');
      accountActions.classList.remove('hidden');
    } else {
      // User is not logged in
      accountUserEmail.textContent = 'Not signed in';
      accountUserPlan.textContent = 'Free plan';
      accountActions.classList.add('hidden');
      this.showSignInForm();
    }
  }

  toggleAccountPopup() {
    const popup = document.getElementById('accountPopup');
    const overlay = document.getElementById('overlay');
    
    if (popup.classList.contains('hidden')) {
      popup.classList.remove('hidden');
      overlay.classList.remove('hidden');
      this.updateAccountPopupUI();
    } else {
      this.closeAccountPopup();
    }
  }

  closeAccountPopup() {
    const popup = document.getElementById('accountPopup');
    const overlay = document.getElementById('overlay');
    
    popup.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  showSignUpForm() {
    document.getElementById('signInForm').classList.add('hidden');
    document.getElementById('signUpForm').classList.remove('hidden');
    this.clearError();
  }

  showSignInForm() {
    document.getElementById('signUpForm').classList.add('hidden');
    document.getElementById('signInForm').classList.remove('hidden');
    this.clearError();
  }

  async handleSignIn() {
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.closeAccountPopup();
      this.clearForms();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async handleSignUp() {
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });

      if (error) throw error;

      if (data.user && !data.session) {
        this.showError('Please check your email to confirm your account');
      } else {
        this.closeAccountPopup();
        this.clearForms();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async handleUpgrade() {
    if (!this.app.user) {
      this.app.showNotification('Please sign in to upgrade', 'error');
      this.showSignInForm();
      return;
    }

    if (this.paymentLoading) return;
    this.paymentLoading = true;

    try {
      this.app.showNotification('Preparing secure checkout...', 'info');

      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            userId: this.app.user.id,
            email: this.app.user.email
          }
        }
      );

      if (error) throw error;
      if (!data) throw new Error('No response from payment server');

      // Handle both direct URL and sessionId redirect methods
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        if (result.error) throw result.error;
      } else {
        throw new Error('No valid payment method received');
      }

    } catch (error) {
      console.error('Payment Error:', error);
      
      const errorMessage = error.message.includes('cancel') 
        ? 'Payment cancelled' 
        : error.message.includes('email') 
          ? 'Invalid email address'
          : `Payment failed: ${error.message.split('.')[0]}`;

      this.app.showNotification(errorMessage, 'error');
    } finally {
      this.paymentLoading = false;
    }
  }

  async handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.closeAccountPopup();
      this.app.currentChatId = null;
      this.app.loadChats();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  showError(message) {
    const errorElements = document.querySelectorAll('#errorMessage, #errorMessageSignUp');
    errorElements.forEach(el => {
      el.textContent = message;
      el.classList.remove('hidden');
    });
  }

  clearError() {
    const errorElements = document.querySelectorAll('#errorMessage, #errorMessageSignUp');
    errorElements.forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  clearForms() {
    ['signInEmail', 'signInPassword', 'signUpEmail', 'signUpPassword'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    this.clearError();
  }
}