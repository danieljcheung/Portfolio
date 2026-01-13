/**
 * Daniel Cheung Portfolio - Main JavaScript
 * Vanilla JS + Anime.js for interactivity
 */

(function() {
    'use strict';

    // ============================================
    // Theme Colors
    // ============================================
    var COLORS = {
        light: '#FDFBF7',
        dark: '#111921'
    };

    // ============================================
    // Dark Mode Toggle with Wash & Reveal Animation
    // ============================================
    var themeToggle = document.getElementById('theme-toggle');
    var html = document.documentElement;
    var isAnimating = false;

    // Check for saved theme preference or default to light
    function getThemePreference() {
        var savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Apply theme without animation (for initial load)
    function applyTheme(theme) {
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }

    // Get all elements that should animate back in
    function getRevealElements() {
        var selectors = [
            'header',
            'section',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p',
            'a',
            'button',
            'article',
            'footer',
            'nav',
            '.logo-icon',
            '.logo-text',
            'li',
            'span'
        ];

        var elements = [];
        var seen = new Set();

        selectors.forEach(function(selector) {
            document.querySelectorAll(selector).forEach(function(el) {
                // Skip if already added
                if (seen.has(el)) return;
                // Skip hidden elements
                if (el.offsetParent === null) return;
                if (el.classList && el.classList.contains('hidden')) return;
                // Skip elements inside hidden containers
                if (el.closest('.hidden')) return;

                seen.add(el);
                elements.push(el);
            });
        });

        // Sort by vertical position (top to bottom)
        elements.sort(function(a, b) {
            var rectA = a.getBoundingClientRect();
            var rectB = b.getBoundingClientRect();
            return rectA.top - rectB.top;
        });

        return elements;
    }

    // Apply theme with wash & reveal animation
    function applyThemeWithAnimation(newTheme, buttonRect) {
        if (isAnimating) return;
        isAnimating = true;

        var toDark = newTheme === 'dark';
        var targetColor = toDark ? COLORS.dark : COLORS.light;

        // Get toggle button center coordinates
        var toggleX = buttonRect.left + buttonRect.width / 2;
        var toggleY = buttonRect.top + buttonRect.height / 2;

        // Create overlay element (on top of everything)
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;background-color:' + targetColor + ';';
        overlay.style.clipPath = 'circle(0px at ' + toggleX + 'px ' + toggleY + 'px)';
        document.body.appendChild(overlay);

        // Get elements to reveal (before hiding them)
        var elements = getRevealElements();

        // Phase 1: Expand the wash overlay
        anime({
            targets: overlay,
            clipPath: [
                'circle(0px at ' + toggleX + 'px ' + toggleY + 'px)',
                'circle(150vmax at ' + toggleX + 'px ' + toggleY + 'px)'
            ],
            duration: 1500,
            easing: 'easeInOutQuad',
            complete: function() {
                // Phase 2: Swap the theme while overlay covers everything
                applyTheme(newTheme);

                // Hide all elements for reveal animation
                elements.forEach(function(el) {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                });

                // Short pause, then reveal
                setTimeout(function() {
                    // Fade out the overlay
                    anime({
                        targets: overlay,
                        opacity: [1, 0],
                        duration: 300,
                        easing: 'easeOutQuad',
                        complete: function() {
                            overlay.remove();
                        }
                    });

                    // Phase 3: Animate elements back in from top to bottom
                    anime({
                        targets: elements,
                        opacity: [0, 1],
                        translateY: [20, 0],
                        delay: anime.stagger(30, { start: 100 }),
                        duration: 400,
                        easing: 'easeOutQuad',
                        complete: function() {
                            // Clean up inline styles
                            elements.forEach(function(el) {
                                el.style.opacity = '';
                                el.style.transform = '';
                            });
                            isAnimating = false;
                        }
                    });
                }, 100);
            }
        });
    }

    // Initialize theme on page load
    var initialTheme = getThemePreference();
    applyTheme(initialTheme);

    // Theme toggle click handler
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            var buttonRect = themeToggle.getBoundingClientRect();

            // Check for reduced motion preference
            var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion || typeof anime === 'undefined') {
                applyTheme(newTheme);
            } else {
                applyThemeWithAnimation(newTheme, buttonRect);
            }
        });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // ============================================
    // Custom Terminal Cursor
    // ============================================

    // Only enable on non-touch devices
    var isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) {
        // Create cursor element with > and blinking underscore
        var terminalCursor = document.createElement('span');
        terminalCursor.className = 'terminal-cursor';

        var cursorPrompt = document.createElement('span');
        cursorPrompt.textContent = '>';

        var cursorUnderscore = document.createElement('span');
        cursorUnderscore.className = 'cursor-underscore';
        cursorUnderscore.textContent = '_';

        terminalCursor.appendChild(cursorPrompt);
        terminalCursor.appendChild(cursorUnderscore);
        document.body.appendChild(terminalCursor);

        var cursorX = 0;
        var cursorY = 0;
        var currentX = 0;
        var currentY = 0;
        var blinkAnimation = null;

        // Track mouse position
        document.addEventListener('mousemove', function(e) {
            cursorX = e.clientX;
            cursorY = e.clientY;
            terminalCursor.classList.remove('hidden');
        });

        // Hide cursor when leaving window
        document.addEventListener('mouseleave', function() {
            terminalCursor.classList.add('hidden');
        });

        // Smooth cursor follow animation
        function updateCursor() {
            // Smooth interpolation
            currentX += (cursorX - currentX) * 0.15;
            currentY += (cursorY - currentY) * 0.15;

            terminalCursor.style.left = currentX + 'px';
            terminalCursor.style.top = currentY + 'px';

            requestAnimationFrame(updateCursor);
        }
        updateCursor();

        // Start blinking animation
        function startBlink() {
            if (blinkAnimation) return;
            blinkAnimation = anime({
                targets: cursorUnderscore,
                opacity: [1, 0],
                duration: 530,
                loop: true,
                easing: 'steps(2)'
            });
        }

        // Stop blinking animation
        function stopBlink() {
            if (blinkAnimation) {
                blinkAnimation.pause();
                blinkAnimation = null;
                cursorUnderscore.style.opacity = '';
            }
        }

        // Detect hover over clickable elements using event delegation
        document.addEventListener('mouseover', function(e) {
            var clickable = e.target.closest('a, button, [role="button"], input, select, textarea, [onclick], label');
            if (clickable) {
                terminalCursor.classList.add('hovering');
                startBlink();
            }
        });

        document.addEventListener('mouseout', function(e) {
            var clickable = e.target.closest('a, button, [role="button"], input, select, textarea, [onclick], label');
            if (clickable) {
                // Check if we're moving to another clickable element
                var relatedClickable = e.relatedTarget ? e.relatedTarget.closest('a, button, [role="button"], input, select, textarea, [onclick], label') : null;
                if (!relatedClickable) {
                    terminalCursor.classList.remove('hovering');
                    stopBlink();
                }
            }
        });

        // Terminal character burst on click
        var terminalChars = ['>', '>>', '/>', '//', '_', '|', '$', '#', '*'];

        document.addEventListener('click', function(e) {
            createTerminalBurst(e.clientX, e.clientY);
        });

        function createTerminalBurst(x, y) {
            var particleCount = 5 + Math.floor(Math.random() * 4); // 5-8 particles
            var particles = [];

            // Create particles with random terminal characters
            for (var i = 0; i < particleCount; i++) {
                var particle = document.createElement('span');
                particle.className = 'click-particle';
                particle.textContent = terminalChars[Math.floor(Math.random() * terminalChars.length)];
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                document.body.appendChild(particle);
                particles.push(particle);
            }

            // Animate particles outward with rotation
            if (typeof anime !== 'undefined') {
                anime({
                    targets: particles,
                    translateX: function() {
                        return anime.random(-70, 70);
                    },
                    translateY: function() {
                        return anime.random(-70, 70);
                    },
                    rotate: function() {
                        return anime.random(-45, 45);
                    },
                    scale: [1, 0.5],
                    opacity: [1, 0],
                    easing: 'easeOutQuad',
                    duration: 600,
                    complete: function() {
                        // Clean up particles
                        particles.forEach(function(p) {
                            if (p.parentNode) {
                                p.parentNode.removeChild(p);
                            }
                        });
                    }
                });
            } else {
                // Fallback: just remove particles
                particles.forEach(function(p) {
                    p.parentNode.removeChild(p);
                });
            }
        }
    }

    // ============================================
    // Mobile Menu Toggle
    // ============================================
    var mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');
    var menuIcon = document.getElementById('menu-icon');

    if (mobileMenuToggle && mobileMenu && menuIcon) {
        mobileMenuToggle.addEventListener('click', function() {
            var isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';

            // Toggle menu visibility
            mobileMenu.classList.toggle('hidden');

            // Update aria-expanded
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);

            // Toggle icon between menu and close
            menuIcon.textContent = isExpanded ? 'menu' : 'close';
        });

        // Close menu when clicking on a link
        var mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                menuIcon.textContent = 'menu';
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                menuIcon.textContent = 'menu';
                mobileMenuToggle.focus();
            }
        });
    }

    // ============================================
    // Dynamic Year in Footer
    // ============================================
    var yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // ============================================
    // Contact Modal
    // ============================================
    var contactModal = document.getElementById('contact-modal');
    var modalBackdrop = document.getElementById('modal-backdrop');
    var modalContent = document.getElementById('modal-content');
    var modalClose = document.getElementById('modal-close');
    var contactBtnHeader = document.getElementById('contact-btn-header');
    var contactBtnMobile = document.getElementById('contact-btn-mobile');
    var contactBtnFooter = document.getElementById('contact-btn-footer');

    function openModal() {
        // Show modal container
        contactModal.classList.remove('hidden');
        contactModal.classList.add('flex');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Trigger animations after a frame
        requestAnimationFrame(function() {
            modalBackdrop.classList.remove('opacity-0');
            modalBackdrop.classList.add('opacity-100');
            modalContent.classList.remove('opacity-0', 'scale-95');
            modalContent.classList.add('opacity-100', 'scale-100');
        });

        // Focus the close button for accessibility
        modalClose.focus();
    }

    function closeModal() {
        // Animate out
        modalBackdrop.classList.remove('opacity-100');
        modalBackdrop.classList.add('opacity-0');
        modalContent.classList.remove('opacity-100', 'scale-100');
        modalContent.classList.add('opacity-0', 'scale-95');

        // Hide after animation completes
        setTimeout(function() {
            contactModal.classList.add('hidden');
            contactModal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    }

    // Open modal triggers
    if (contactBtnHeader) {
        contactBtnHeader.addEventListener('click', openModal);
    }
    if (contactBtnMobile) {
        contactBtnMobile.addEventListener('click', function() {
            // Close mobile menu first
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                menuIcon.textContent = 'menu';
            }
            openModal();
        });
    }
    if (contactBtnFooter) {
        contactBtnFooter.addEventListener('click', openModal);
    }

    // Close modal triggers
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && contactModal && !contactModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');

            // Skip if it's just "#"
            if (targetId === '#') return;

            var targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                // Account for sticky header height
                var headerHeight = document.querySelector('header').offsetHeight;
                var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update focus for accessibility
                targetElement.setAttribute('tabindex', '-1');
                targetElement.focus({ preventScroll: true });
            }
        });
    });

    // ============================================
    // Scroll-based Animations
    // ============================================

    // Check for reduced motion preference
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        var observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var animationType = el.dataset.animation || 'fade-in-up';

                    el.classList.add('animate-' + animationType);
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        // Observe all elements with animate-on-scroll class
        document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
            observer.observe(el);
        });
    } else {
        // If reduced motion, just show everything
        document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
            el.classList.remove('animate-on-scroll');
        });
    }

})();
