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
    // Custom Terminal Cursor (Performance Optimized)
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
        var cursorTicking = false;
        var cursorAnimating = false;

        // Throttled mouse position tracking
        document.addEventListener('mousemove', function(e) {
            cursorX = e.clientX;
            cursorY = e.clientY;
            terminalCursor.classList.remove('hidden');

            // Start animation loop if not already running
            if (!cursorAnimating) {
                cursorAnimating = true;
                requestAnimationFrame(updateCursor);
            }
        }, { passive: true });

        // Hide cursor when leaving window
        document.addEventListener('mouseleave', function() {
            terminalCursor.classList.add('hidden');
            cursorAnimating = false;
        }, { passive: true });

        // Smooth cursor follow animation (only runs when mouse is moving)
        function updateCursor() {
            if (!cursorAnimating) return;

            // Smooth interpolation
            var dx = cursorX - currentX;
            var dy = cursorY - currentY;
            currentX += dx * 0.15;
            currentY += dy * 0.15;

            terminalCursor.style.left = currentX + 'px';
            terminalCursor.style.top = currentY + 'px';

            // Stop animating when cursor is close enough to target
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                requestAnimationFrame(updateCursor);
            } else {
                cursorAnimating = false;
            }
        }

        // Start cursor glow pulse animation
        var glowAnimation = null;
        function startGlowPulse() {
            if (glowAnimation || typeof anime === 'undefined') return;

            // Check if dark mode is active for color
            var isDark = document.documentElement.classList.contains('dark');
            var glowColor = isDark ? '#4caf50' : '#2e7d32';

            glowAnimation = anime({
                targets: terminalCursor,
                textShadow: [
                    '0 0 5px ' + glowColor + ', 0 0 10px ' + glowColor + ', 0 0 20px ' + glowColor,
                    '0 0 10px ' + glowColor + ', 0 0 25px ' + glowColor + ', 0 0 40px ' + glowColor,
                    '0 0 5px ' + glowColor + ', 0 0 10px ' + glowColor + ', 0 0 20px ' + glowColor
                ],
                duration: 2000,
                loop: true,
                easing: 'easeInOutSine'
            });
        }

        // Start glow pulse immediately
        startGlowPulse();

        // Restart glow animation when theme changes
        var originalApplyTheme = applyTheme;
        applyTheme = function(theme) {
            originalApplyTheme(theme);
            // Restart glow with new color after theme change
            if (glowAnimation) {
                glowAnimation.pause();
                glowAnimation = null;
            }
            setTimeout(startGlowPulse, 100);
        };

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
        }, { passive: true });

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
        }, { passive: true });

        // Terminal character burst on click (skip for modal triggers)
        var terminalChars = ['>', '>>', '/>', '//', '_', '|', '$', '#', '*'];

        document.addEventListener('click', function(e) {
            // Skip burst for modal-related elements to reduce lag
            if (e.target.closest('#contact-modal, #contact-btn-header, #contact-btn-mobile, #contact-btn-footer')) {
                return;
            }
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
        }, 200);
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

    // ============================================
    // Image Gallery Modal (Carousel)
    // ============================================
    var galleryModal = document.getElementById('gallery-modal');
    var galleryBackdrop = document.getElementById('gallery-backdrop');
    var galleryContent = document.getElementById('gallery-content');
    var galleryClose = document.getElementById('gallery-close');
    var galleryPrev = document.getElementById('gallery-prev');
    var galleryNext = document.getElementById('gallery-next');
    var galleryCounter = document.getElementById('gallery-counter');
    var galleryTriggers = document.querySelectorAll('.gallery-trigger');

    // Carousel elements
    var carouselPrev = document.getElementById('carousel-prev');
    var carouselCurrent = document.getElementById('carousel-current');
    var carouselNext = document.getElementById('carousel-next');

    var galleryImages = [];
    var currentImageIndex = 0;
    var galleryIsAnimating = false;

    // Get index with wrapping (infinite loop)
    function getWrappedIndex(index) {
        var len = galleryImages.length;
        return ((index % len) + len) % len;
    }

    // Load image into a carousel item
    function loadCarouselImage(element, index) {
        if (!element || galleryImages.length === 0) return;
        var img = element.querySelector('img');
        if (img) {
            img.src = galleryImages[getWrappedIndex(index)];
        }
    }

    // Update counter display
    function updateCounter() {
        if (galleryCounter) {
            galleryCounter.textContent = (currentImageIndex + 1) + ' / ' + galleryImages.length;
        }
    }

    // Set initial carousel positions (no animation)
    function initCarousel() {
        // Load images
        loadCarouselImage(carouselPrev, currentImageIndex - 1);
        loadCarouselImage(carouselCurrent, currentImageIndex);
        loadCarouselImage(carouselNext, currentImageIndex + 1);

        // Reset positions using CSS classes
        if (carouselPrev) {
            carouselPrev.style.transform = '';
            carouselPrev.style.opacity = '';
            carouselPrev.className = 'carousel-item carousel-prev absolute';
        }
        if (carouselCurrent) {
            carouselCurrent.style.transform = '';
            carouselCurrent.style.opacity = '';
            carouselCurrent.className = 'carousel-item carousel-current absolute';
        }
        if (carouselNext) {
            carouselNext.style.transform = '';
            carouselNext.style.opacity = '';
            carouselNext.className = 'carousel-item carousel-next absolute';
        }

        updateCounter();
    }

    function openGallery(images, startIndex) {
        if (!galleryModal || galleryIsAnimating) return;

        galleryImages = images;
        currentImageIndex = startIndex || 0;

        // Show modal container
        galleryModal.classList.remove('hidden');
        galleryModal.classList.add('flex');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Initialize carousel
        initCarousel();

        // Animate in
        if (typeof anime !== 'undefined') {
            galleryIsAnimating = true;
            anime({
                targets: galleryBackdrop,
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuad'
            });
            anime({
                targets: galleryContent,
                opacity: [0, 1],
                scale: [0.95, 1],
                duration: 400,
                easing: 'easeOutQuad',
                complete: function() {
                    galleryIsAnimating = false;
                    galleryClose.focus();
                }
            });
        } else {
            galleryBackdrop.style.opacity = '1';
            galleryContent.style.opacity = '1';
            galleryClose.focus();
        }
    }

    function closeGallery() {
        if (!galleryModal || galleryIsAnimating) return;

        if (typeof anime !== 'undefined') {
            galleryIsAnimating = true;
            anime({
                targets: galleryBackdrop,
                opacity: [1, 0],
                duration: 200,
                easing: 'easeOutQuad'
            });
            anime({
                targets: galleryContent,
                opacity: [1, 0],
                scale: [1, 0.95],
                duration: 200,
                easing: 'easeOutQuad',
                complete: function() {
                    galleryModal.classList.add('hidden');
                    galleryModal.classList.remove('flex');
                    document.body.style.overflow = '';
                    galleryIsAnimating = false;
                }
            });
        } else {
            galleryBackdrop.style.opacity = '0';
            galleryContent.style.opacity = '0';
            galleryModal.classList.add('hidden');
            galleryModal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }

    // Carousel animation positions
    var positions = {
        hiddenLeft: { translateX: '-170%', scale: 0.6, opacity: 0, zIndex: 0 },
        prev: { translateX: '-85%', scale: 0.75, opacity: 0.5, zIndex: 1 },
        current: { translateX: '0%', scale: 1, opacity: 1, zIndex: 10 },
        next: { translateX: '85%', scale: 0.75, opacity: 0.5, zIndex: 1 },
        hiddenRight: { translateX: '170%', scale: 0.6, opacity: 0, zIndex: 0 }
    };

    function animateToPosition(element, position, duration, easing) {
        if (!element || typeof anime === 'undefined') return null;

        element.style.zIndex = position.zIndex;

        return anime({
            targets: element,
            translateX: position.translateX,
            scale: position.scale,
            opacity: position.opacity,
            duration: duration,
            easing: easing || 'easeOutQuad'
        });
    }

    function nextImage() {
        if (galleryIsAnimating || galleryImages.length <= 1) return;
        galleryIsAnimating = true;

        var duration = 400;
        var easing = 'easeOutCubic';

        // Current -> Prev (slide left, shrink, fade)
        animateToPosition(carouselCurrent, positions.prev, duration, easing);

        // Next -> Current (slide to center, grow, brighten)
        animateToPosition(carouselNext, positions.current, duration, easing);

        // Prev -> Hidden left (slide out)
        animateToPosition(carouselPrev, positions.hiddenLeft, duration, easing);

        // After animation, update indices and reset
        setTimeout(function() {
            currentImageIndex = getWrappedIndex(currentImageIndex + 1);

            // Swap references: prev becomes the old current, current becomes old next
            var tempPrev = carouselPrev;
            carouselPrev = carouselCurrent;
            carouselCurrent = carouselNext;
            carouselNext = tempPrev;

            // Load new next image and position it on the right (hidden)
            loadCarouselImage(carouselNext, currentImageIndex + 1);
            carouselNext.style.transform = 'translateX(170%) scale(0.6)';
            carouselNext.style.opacity = '0';
            carouselNext.style.zIndex = '0';

            // Immediately snap to next position (ready for next animation)
            requestAnimationFrame(function() {
                carouselNext.style.transform = 'translateX(85%) scale(0.75)';
                carouselNext.style.opacity = '0.5';
                carouselNext.style.zIndex = '1';
            });

            updateCounter();
            galleryIsAnimating = false;
        }, duration + 50);
    }

    function prevImage() {
        if (galleryIsAnimating || galleryImages.length <= 1) return;
        galleryIsAnimating = true;

        var duration = 400;
        var easing = 'easeOutCubic';

        // Current -> Next (slide right, shrink, fade)
        animateToPosition(carouselCurrent, positions.next, duration, easing);

        // Prev -> Current (slide to center, grow, brighten)
        animateToPosition(carouselPrev, positions.current, duration, easing);

        // Next -> Hidden right (slide out)
        animateToPosition(carouselNext, positions.hiddenRight, duration, easing);

        // After animation, update indices and reset
        setTimeout(function() {
            currentImageIndex = getWrappedIndex(currentImageIndex - 1);

            // Swap references: next becomes the old current, current becomes old prev
            var tempNext = carouselNext;
            carouselNext = carouselCurrent;
            carouselCurrent = carouselPrev;
            carouselPrev = tempNext;

            // Load new prev image and position it on the left (hidden)
            loadCarouselImage(carouselPrev, currentImageIndex - 1);
            carouselPrev.style.transform = 'translateX(-170%) scale(0.6)';
            carouselPrev.style.opacity = '0';
            carouselPrev.style.zIndex = '0';

            // Immediately snap to prev position (ready for next animation)
            requestAnimationFrame(function() {
                carouselPrev.style.transform = 'translateX(-85%) scale(0.75)';
                carouselPrev.style.opacity = '0.5';
                carouselPrev.style.zIndex = '1';
            });

            updateCounter();
            galleryIsAnimating = false;
        }, duration + 50);
    }

    // Gallery trigger click handlers
    galleryTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            var imagesData = trigger.getAttribute('data-images');
            if (imagesData) {
                try {
                    var images = JSON.parse(imagesData);
                    openGallery(images, 0);
                } catch (err) {
                    console.error('Invalid gallery images data:', err);
                }
            }
        });
    });

    // Close button
    if (galleryClose) {
        galleryClose.addEventListener('click', closeGallery);
    }

    // Backdrop click to close (but not on carousel items)
    if (galleryBackdrop) {
        galleryBackdrop.addEventListener('click', closeGallery);
    }

    // Also close when clicking on the carousel container (outside images)
    var galleryCarousel = document.getElementById('gallery-carousel');
    if (galleryCarousel) {
        galleryCarousel.addEventListener('click', function(e) {
            // Only close if clicking directly on the carousel container, not on images
            if (e.target === galleryCarousel) {
                closeGallery();
            }
        });
    }

    // Navigation buttons
    if (galleryPrev) {
        galleryPrev.addEventListener('click', prevImage);
    }
    if (galleryNext) {
        galleryNext.addEventListener('click', nextImage);
    }

    // Click on side images to navigate (using event delegation)
    if (galleryCarousel) {
        galleryCarousel.addEventListener('click', function(e) {
            var target = e.target.closest('.carousel-item');
            if (!target) return;

            // Check if it's a side image by its current transform position
            var style = window.getComputedStyle(target);
            var transform = style.transform || style.webkitTransform;

            // Parse the transform matrix to get translateX
            if (transform && transform !== 'none') {
                var matrix = new DOMMatrix(transform);
                var translateX = matrix.m41;

                // If translateX is significantly negative, it's the prev image
                if (translateX < -100) {
                    e.stopPropagation();
                    prevImage();
                }
                // If translateX is significantly positive, it's the next image
                else if (translateX > 100) {
                    e.stopPropagation();
                    nextImage();
                }
            }
        });

        // Keyboard support for side images
        galleryCarousel.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;

            var target = e.target.closest('.carousel-item');
            if (!target) return;

            var style = window.getComputedStyle(target);
            var transform = style.transform || style.webkitTransform;

            if (transform && transform !== 'none') {
                var matrix = new DOMMatrix(transform);
                var translateX = matrix.m41;

                if (translateX < -100) {
                    e.preventDefault();
                    prevImage();
                } else if (translateX > 100) {
                    e.preventDefault();
                    nextImage();
                }
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!galleryModal || galleryModal.classList.contains('hidden')) return;

        switch (e.key) {
            case 'Escape':
                closeGallery();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
        }
    });

})();
