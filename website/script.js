// ===== Supabase Configuration =====
const SUPABASE_URL = "https://xcxgjpzlnzpycezduwru.supabase.co";
const SUPABASE_KEY = "sb_publishable_o92Wce4jifE_RCv0_Q18ig_ipTTA1YD";

let supabase = null;
if (typeof window.supabase !== "undefined") {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ===== Page Transitions =====
function navigateTo(url) {
  const content = document.getElementById("page-content");
  if (content) {
    content.classList.add("page-exit");
    setTimeout(() => {
      window.location.href = url;
    }, 250);
  } else {
    window.location.href = url;
  }
}

// Landing page buttons
document.querySelectorAll("[data-href]").forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.href));
});

// ===== Landing Page Particles =====
(function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const count = Math.min(36, Math.floor(window.innerWidth / 40));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.8 + 0.4,
      o: Math.random() * 0.3 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(129, 140, 248, " + p.o + ")";
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ===== Shared Helpers =====
function getEl(id) {
  return document.getElementById(id);
}

function showError(msgEl, message) {
  msgEl.textContent = message;
  msgEl.classList.add("visible");
}

function clearMsg(msgEl) {
  msgEl.textContent = "";
  msgEl.classList.remove("visible");
}

function setBtnLoading(btn, labelEl, spinnerEl, loading) {
  btn.disabled = loading;
  labelEl.hidden = loading;
  spinnerEl.hidden = !loading;
}

function setGoogleLoading(googleBtn, loading) {
  googleBtn.disabled = loading;
  googleBtn.style.opacity = loading ? "0.6" : "1";
}

// ===== Password Toggle (shared by login + signup) =====
const togglePwBtn = getEl("toggle-pw");
if (togglePwBtn) {
  togglePwBtn.addEventListener("click", () => {
    const passwordInput = getEl("password");
    const eyeOpen = document.querySelector(".eye-open");
    const eyeClosed = document.querySelector(".eye-closed");
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    eyeOpen.style.display = isHidden ? "none" : "block";
    eyeClosed.style.display = isHidden ? "block" : "none";
    togglePwBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    passwordInput.focus();
  });
}

// ===== Login Page Logic =====
const loginForm = getEl("login-form");
if (loginForm && supabase) {
  const emailInput = getEl("email");
  const passwordInput = getEl("password");
  const errorMsg = getEl("error-msg");
  const infoMsg = getEl("info-msg");
  const loginBtn = getEl("login-btn");
  const btnLabel = document.querySelector(".btn-label");
  const btnSpinner = document.querySelector(".btn-spinner");
  const googleBtn = getEl("google-btn");
  const forgotLink = getEl("forgot-link");

  emailInput.addEventListener("input", () => { clearMsg(errorMsg); clearMsg(infoMsg); });
  passwordInput.addEventListener("input", () => { clearMsg(errorMsg); clearMsg(infoMsg); });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg(errorMsg);
    clearMsg(infoMsg);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError(errorMsg, "Please enter your email and password.");
      return;
    }

    setBtnLoading(loginBtn, btnLabel, btnSpinner, true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showError(errorMsg, error.message || "Unable to sign in. Please check your credentials.");
        setBtnLoading(loginBtn, btnLabel, btnSpinner, false);
        return;
      }

      navigateTo("dashboard.html");
    } catch (err) {
      showError(errorMsg, "Something went wrong. Please try again.");
      setBtnLoading(loginBtn, btnLabel, btnSpinner, false);
    }
  });

  googleBtn.addEventListener("click", async () => {
    clearMsg(errorMsg);
    clearMsg(infoMsg);
    setGoogleLoading(googleBtn, true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard.html",
        },
      });

      if (error) {
        showError(errorMsg, error.message || "Unable to sign in with Google.");
        setGoogleLoading(googleBtn, false);
      }
    } catch (err) {
      showError(errorMsg, "Something went wrong with Google sign-in.");
      setGoogleLoading(googleBtn, false);
    }
  });

  forgotLink.addEventListener("click", async (e) => {
    e.preventDefault();
    clearMsg(errorMsg);
    clearMsg(infoMsg);

    const email = emailInput.value.trim();

    if (!email) {
      showError(errorMsg, "Enter your email above, then click 'Forgot password?' again.");
      emailInput.focus();
      return;
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/dashboard.html",
      });

      if (error) {
        showError(errorMsg, error.message || "Unable to send reset email.");
        return;
      }

      clearMsg(errorMsg);
      infoMsg.textContent = "Password reset link sent. Check your inbox.";
      infoMsg.classList.add("visible");
    } catch (err) {
      showError(errorMsg, "Something went wrong. Please try again.");
    }
  });
}

// ===== Signup Page Logic =====
const signupForm = getEl("signup-form");
if (signupForm && supabase) {
  const emailInput = getEl("email");
  const passwordInput = getEl("password");
  const errorMsg = getEl("error-msg");
  const infoMsg = getEl("info-msg");
  const signupBtn = getEl("signup-btn");
  const btnLabel = document.querySelector(".btn-label");
  const btnSpinner = document.querySelector(".btn-spinner");
  const googleBtn = getEl("google-btn");

  emailInput.addEventListener("input", () => { clearMsg(errorMsg); clearMsg(infoMsg); });
  passwordInput.addEventListener("input", () => { clearMsg(errorMsg); clearMsg(infoMsg); });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg(errorMsg);
    clearMsg(infoMsg);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError(errorMsg, "Please enter your email and a password.");
      return;
    }

    if (password.length < 6) {
      showError(errorMsg, "Password must be at least 6 characters long.");
      return;
    }

    setBtnLoading(signupBtn, btnLabel, btnSpinner, true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        showError(errorMsg, error.message || "Unable to create account.");
        setBtnLoading(signupBtn, btnLabel, btnSpinner, false);
        return;
      }

      if (data.user && data.session) {
        navigateTo("dashboard.html");
      } else {
        clearMsg(errorMsg);
        infoMsg.textContent = "Account created. Check your inbox for a confirmation link, then sign in.";
        infoMsg.classList.add("visible");
        setBtnLoading(signupBtn, btnLabel, btnSpinner, false);
      }
    } catch (err) {
      showError(errorMsg, "Something went wrong. Please try again.");
      setBtnLoading(signupBtn, btnLabel, btnSpinner, false);
    }
  });

  googleBtn.addEventListener("click", async () => {
    clearMsg(errorMsg);
    clearMsg(infoMsg);
    setGoogleLoading(googleBtn, true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard.html",
        },
      });

      if (error) {
        showError(errorMsg, error.message || "Unable to sign up with Google.");
        setGoogleLoading(googleBtn, false);
      }
    } catch (err) {
      showError(errorMsg, "Something went wrong with Google sign-up.");
      setGoogleLoading(googleBtn, false);
    }
  });
}
