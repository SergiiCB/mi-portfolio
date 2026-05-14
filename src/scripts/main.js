import { translations } from './i18n.js';

// ===== CONFIGURACIÓN Y ESTADO GLOBAL =====
let currentLang = localStorage.getItem('preferredLang') || 'es';
let typedInstance = {
  textIndex: 0,
  charIndex: 0,
  isDeleting: false,
  timeout: null
};

// ===== UTILIDADES =====
const safeQuery = (selector) => {
  const el = document.querySelector(selector);
  if (!el) console.warn(`⚠️ Elemento no encontrado: ${selector}`);
  return el;
};

const safeQueryAll = (selector) => {
  const els = document.querySelectorAll(selector);
  if (!els.length) console.warn(`⚠️ Elementos no encontrados: ${selector}`);
  return els;
};

// ===== TRADUCCIÓN Y TYPED EFFECT =====
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('preferredLang', lang);

  // 1. Traducir textos estáticos
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang]?.[key]) {
      if (key !== 'hero_typed') {
        el.textContent = translations[lang][key];
      }
    }
  });

  // 2. Traducir Placeholders del formulario
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang]?.[key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // Feedback botones
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('opacity-50', btn.dataset.lang !== lang);
  });

  resetTyped();
}

function resetTyped() {
  const typedElement = safeQuery('#typed-text');
  if (!typedElement) return;
  
  // Limpiamos el timeout anterior para que no se pisen los idiomas
  if (typedInstance.timeout) clearTimeout(typedInstance.timeout);
  
  typedInstance.textIndex = 0;
  typedInstance.charIndex = 0;
  typedInstance.isDeleting = false;
  
  typeEffect();
}

function typeEffect() {
  const typedElement = safeQuery('#typed-text');
  if (!typedElement) return;

  const texts = translations[currentLang]?.["hero_typed"] || ['Data Scientist'];
  const currentText = texts[typedInstance.textIndex];

  if (typedInstance.isDeleting) {
    typedElement.textContent = currentText.substring(0, typedInstance.charIndex - 1);
    typedInstance.charIndex--;
  } else {
    typedElement.textContent = currentText.substring(0, typedInstance.charIndex + 1);
    typedInstance.charIndex++;
  }

  let speed = typedInstance.isDeleting ? 50 : 100;

  if (!typedInstance.isDeleting && typedInstance.charIndex === currentText.length) {
    speed = 2000; // Pausa al terminar de escribir
    typedInstance.isDeleting = true;
  } else if (typedInstance.isDeleting && typedInstance.charIndex === 0) {
    typedInstance.isDeleting = false;
    typedInstance.textIndex = (typedInstance.textIndex + 1) % texts.length;
    speed = 500;
  }

  typedInstance.timeout = setTimeout(typeEffect, speed);
}

// ===== NAVBAR & NAVIGATION =====
function initNavbar() {
  const navbar = safeQuery('#navbar');
  const navToggle = safeQuery('#navToggle');
  const mobileMenu = safeQuery('#mobileMenu');
  const sections = safeQueryAll('section');
  const navLinks = safeQueryAll('.nav-link');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('glass', window.scrollY > 50);
      
      // Active Link Logic
      let current = '';
      const scrollPos = window.scrollY + 300;

      sections.forEach(sec => {
        if (scrollPos >= sec.offsetTop) {
          current = sec.id;
        }
      });

      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60) {
        current = 'contact';
      }

      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${current}`;
        link.classList.toggle('text-text-primary', isActive);
        link.classList.toggle('bg-white/10', isActive);
        link.classList.toggle('text-text-secondary', !isActive);
      });
    });
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('translate-x-full');
    });

    safeQueryAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        navToggle.classList.remove('active');
      });
    });
  }
}

// ===== INTERSECTION OBSERVERS (REVEAL + SKILLS + COUNTERS) =====
function initRevealObservers() {
  const revealElements = safeQueryAll('.reveal');
  
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // Skill bars
        const skillBar = entry.target.querySelector('.skill-bar');
        if (skillBar && skillBar.dataset.width) {
          skillBar.style.width = skillBar.dataset.width + '%';
        }
        
        // Counters - Versión Multicontador
        const counters = entry.target.querySelectorAll('.counter');
        counters.forEach(counter => {
          if (counter && !counter.dataset.animated) {
            counter.dataset.animated = 'true';
            const target = +counter.dataset.target;
            let count = 0;
            const duration = 2000; 
            const stepTime = 1000 / 60;
            const increment = target / (duration / stepTime);
          
            const timer = setInterval(() => {
              count += increment;
              if (count >= target) {
                counter.textContent = target + '+';
                clearInterval(timer);
              } else {
                counter.textContent = Math.floor(count) + '+';
              }
            }, stepTime);
          }
        });
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => observer.observe(el));
}

// ===== FILTRO DE PROYECTOS =====
function initProjectFilter() {
  const filterBtns = safeQueryAll('.filter-btn');
  const projectCards = safeQueryAll('.project-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-accent', 'text-white'); // Limpiamos estilos
        b.classList.add('text-text-secondary');
      });
      
      btn.classList.add('active', 'bg-accent', 'text-white');
      btn.classList.remove('text-text-secondary');
      
      const filter = btn.dataset.filter;
      
      projectCards.forEach(card => {
        const isMatch = filter === 'all' || card.dataset.category === filter;
        
        if (isMatch) {
          card.classList.remove('hidden');
          // Pequeño timeout para que la transición de opacidad funcione
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => card.classList.add('hidden'), 300);
        }
      });
    });
  });
}

// ===== FORMULARIO Y CONTACTO =====
function initContactForm() {
  const form = safeQuery('#contactForm');
  const toast = safeQuery('#toast');
  
  if (!form || !toast) return;

  form.addEventListener('submit', e => {
    e.preventDefault(); // Evitamos que la página se recargue
    
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '⏳ Enviando...';
    btn.disabled = true;

    // --- ENVÍO REAL A NETLIFY ---
    const formData = new FormData(form);
    
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    })
    .then(() => {
      // Si el envío es correcto, mostramos animación
      btn.innerHTML = originalText;
      btn.disabled = false;
      form.reset();

      const toastMessage = safeQuery('#toastMessage');
      if (toastMessage) toastMessage.textContent = '¡Mensaje enviado con éxito!';
      
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    })
    .catch((error) => {
      alert("Error al enviar: " + error);
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
  });
}

// ===== CANVAS PARTICLES =====
function initParticles() {
  const canvas = safeQuery('#particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
      if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
    }
    draw() {
      ctx.fillStyle = `rgba(108, 92, 231, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    // Conexiones
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.strokeStyle = `rgba(108, 92, 231, ${0.1 * (1 - dist/100)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    animationId = requestAnimationFrame(animate);
  };

  resize();
  particles = Array.from({ length: 70 }, () => new Particle());
  animate();

  window.addEventListener('resize', resize);
  document.addEventListener('astro:before-preparation', () => {
    cancelAnimationFrame(animationId);
  });
}

// ===== INICIALIZACIÓN GENERAL =====
function initApp() {
  // 1. Limpiar intervalos o animaciones previas (Evita duplicados en Astro)
  if (typedInstance.timeout) clearTimeout(typedInstance.timeout);

  // 2. Configurar botones de idioma
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    // Clonamos el nodo para eliminar listeners viejos si usas View Transitions
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => applyLanguage(newBtn.dataset.lang));
  });

  // 3. Estado inicial y Core
  applyLanguage(currentLang);
  initNavbar();
  initRevealObservers();
  initProjectFilter();
  initContactForm();
  initParticles();

  // 4. Botón Back to Top
  const btt = safeQuery('#backToTop');
  if (btt) {
    // Quitamos el listener previo para no acumularlos
    window.removeEventListener('scroll', handleBTT); 
    window.addEventListener('scroll', handleBTT);
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // 5. Forzar revelado (Fix para que no se quede la pantalla en blanco)
  setTimeout(() => {
    // Si el usuario ya está haciendo scroll, disparar observer
    window.dispatchEvent(new Event('scroll'));
    // Fallback: si después de 1s nada se ha revelado, mostrar todo
    const firstReveal = document.querySelector('.reveal');
    if (firstReveal && !firstReveal.classList.contains('active')) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }
  }, 600);
}

// Función auxiliar para el botón Back to Top
function handleBTT() {
  const btt = document.querySelector('#backToTop');
  if (btt) btt.classList.toggle('opacity-0', window.scrollY < 500);
}

// ===== GESTIÓN DE CARGA (ASTRO COMPATIBLE) =====

// Manejo estándar de carga de página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Manejo específico para Astro View Transitions
document.addEventListener('astro:page-load', () => {
  initApp();
});

// Limpieza antes de cambiar de página (opcional pero recomendado)
document.addEventListener('astro:before-preparation', () => {
  // Aquí podrías detener el canvas de partículas si quieres optimizar
});