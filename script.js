class MacOSPortfolio {
    constructor() {
        this.isDarkMode = true;
        this.apps = {};
        this.minimizedWindows = {}; // Track minimized apps
        this.init();
    }

    async init() {
        await this.loadApps();
        this.createAppWindows();
        this.setupDesktopIcons();
        this.setupDockInteractions();
        this.setupThemeToggle();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.setupLockScreen();

        // initialize draggable terminal (idempotent)
        this.setupDraggableTerminal();

        // makeTerminalDraggable alias so onBootComplete() and older code paths work
        this.makeTerminalDraggable = this.setupDraggableTerminal.bind(this);

        // terminal greeting removed from here — will start after boot
        this.startBootSequence();
        this.setupHelpTerminal();
        this.setupMobileUI();
        this.checkMobileUI();
        window.addEventListener('resize', () => this.checkMobileUI());

    }




    async loadApps() {
        try {
            const response = await fetch('info.json');
            this.apps = await response.json();
        } catch (err) {
            console.error("Failed to load info.json", err);
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        document.getElementById('current-time').textContent = timeString;
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('dark-mode', this.isDarkMode);
            themeToggle.textContent = this.isDarkMode ? '🌙' : '☀️';
        });
    }

    setupDockInteractions() {
        const dockItems = document.querySelectorAll('.dock-item');
        dockItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = item.getAttribute('data-app');
                this.openApp(app);
            });
            item.addEventListener('mouseenter', () => this.adjustDockItems(item));
            item.addEventListener('mouseleave', () => this.resetDockItems());
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.app-window') && !e.target.closest('.dock-item') && !e.target.closest('.desktop-icon')) {
                this.closeAllApps();
            }
        });
    }

    setupDesktopIcons() {
        const desktopIcons = document.querySelectorAll('.desktop-icon');

        desktopIcons.forEach(icon => {
            const appId = icon.getAttribute('data-app');
            icon.addEventListener('click', () => {
                this.openApp(appId); // this now points to the dynamically created window
            });
        });
    }




    adjustDockItems(hoveredItem) {
        const dockItems = document.querySelectorAll('.dock-item');
        const hoveredIndex = Array.from(dockItems).indexOf(hoveredItem);
        dockItems.forEach((item, index) => {
            const distance = Math.abs(index - hoveredIndex);
            if (distance === 1) item.style.transform = 'scale(1.3) translateY(-5px)', item.style.margin = '0 8px';
            else if (distance === 2) item.style.transform = 'scale(1.1) translateY(-2px)', item.style.margin = '0 6px';
        });
    }

    resetDockItems() {
        document.querySelectorAll('.dock-item').forEach(item => {
            item.style.transform = '';
            item.style.margin = '';
        });
    }

    createAppWindows() {
        const appsContainer = document.getElementById('app-windows');
        Object.entries(this.apps).forEach(([appId, appData]) => {
            const windowElement = document.createElement('div');
            windowElement.className = 'app-window';
            windowElement.id = `window-${appId}`;
            windowElement.dataset.minimized = "false";
            windowElement.dataset.maximized = "false";
            windowElement.style.width = '500px';
            windowElement.style.height = '400px';
            windowElement.style.left = '50%';
            windowElement.style.top = '50%';
            windowElement.style.transform = 'translate(-50%, -50%)';
            windowElement.innerHTML = `
                <div class="window-header">
                    <div class="window-controls">
                        <div class="window-control close"></div>
                        <div class="window-control minimize"></div>
                        <div class="window-control maximize"></div>
                    </div>
                    <div class="window-title">${appData.title}</div>
                    <div style="width: 60px;"></div>
                </div>
                <div class="window-content">${appData.content}</div>
            `;
            appsContainer.appendChild(windowElement);

            // Add button event listeners
            const closeBtn = windowElement.querySelector('.close');
            const minimizeBtn = windowElement.querySelector('.minimize');
            const maximizeBtn = windowElement.querySelector('.maximize');

            closeBtn.addEventListener('click', () => this.closeApp(appId));
            minimizeBtn.addEventListener('click', () => this.minimizeApp(appId));
            maximizeBtn.addEventListener('click', () => this.toggleMaximizeApp(appId));
        });
    }

    openApp(appId) {
        const appWindow = document.getElementById(`window-${appId}`);
        if (!appWindow) return;

        if (appWindow.dataset.minimized === "true") {
            // Restore minimized window
            this.restoreAppFromDock(appId);
        } else {
            this.closeAllApps();
            appWindow.style.display = 'block';
            if (appId === "terminal") this.startTerminalGreeting();
            appWindow.classList.add('bounce-in');
            setTimeout(() => appWindow.classList.remove('bounce-in'), 500);
        }

        if (appId === 'github' || appId === 'linkedin') {
            setTimeout(() => console.log(`Opening ${appId} profile`), 1000);
        }
    }

    closeApp(appId) {
        const appWindow = document.getElementById(`window-${appId}`);
        if (!appWindow) return;

        appWindow.classList.add('bounce-out');
        setTimeout(() => {
            appWindow.style.display = 'none';
            appWindow.classList.remove('bounce-out');
        }, 300);
    }

    closeAllApps() {
        document.querySelectorAll('.app-window').forEach(window => window.style.display = 'none');
    }

    minimizeApp(appId) {
        const appWindow = document.getElementById(`window-${appId}`);
        if (!appWindow) return;

        // Animate to dock
        const dockItem = document.querySelector(`.dock-item[data-app="${appId}"] .icon`);
        const rectWindow = appWindow.getBoundingClientRect();
        const rectDock = dockItem.getBoundingClientRect();
        const deltaX = rectDock.left + rectDock.width / 2 - (rectWindow.left + rectWindow.width / 2);
        const deltaY = rectDock.top + rectDock.height / 2 - (rectWindow.top + rectWindow.height / 2);

        appWindow.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        appWindow.style.transform += ` translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
        appWindow.style.opacity = '0';
        setTimeout(() => {
            appWindow.style.display = 'none';
            appWindow.style.transform = 'translate(-50%, -50%)';
            appWindow.style.opacity = '1';
            appWindow.style.transition = '';
            appWindow.dataset.minimized = "true";
        }, 400);
    }

    restoreAppFromDock(appId) {
        const appWindow = document.getElementById(`window-${appId}`);
        if (!appWindow) return;

        appWindow.dataset.minimized = "false";
        appWindow.style.display = 'block';
        appWindow.classList.add('bounce-in');
        setTimeout(() => appWindow.classList.remove('bounce-in'), 500);
    }

    toggleMaximizeApp(appId) {
        const appWindow = document.getElementById(`window-${appId}`);
        if (!appWindow) return;

        const maximized = appWindow.dataset.maximized === "true";

        if (!maximized) {
            // Save original size and position
            appWindow.dataset.origWidth = appWindow.style.width;
            appWindow.dataset.origHeight = appWindow.style.height;
            appWindow.dataset.origLeft = appWindow.style.left;
            appWindow.dataset.origTop = appWindow.style.top;

            appWindow.style.top = '0';
            appWindow.style.left = '0';
            appWindow.style.width = '100%';
            appWindow.style.height = '100%';
            appWindow.style.transform = 'none';
            appWindow.dataset.maximized = "true";
        } else {
            appWindow.style.width = appWindow.dataset.origWidth;
            appWindow.style.height = appWindow.dataset.origHeight;
            appWindow.style.left = appWindow.dataset.origLeft;
            appWindow.style.top = appWindow.dataset.origTop;
            appWindow.style.transform = 'translate(-50%, -50%)';
            appWindow.dataset.maximized = "false";
        }
    }

    setupLockScreen() {
        const appleLogo = document.querySelector('.apple-logo');
        const lockScreen = document.getElementById('lock-screen');
        const passwordInput = document.getElementById('lock-password');
        const unlockBtn = document.getElementById('unlock-btn');
        const lockError = document.getElementById('lock-error');

        appleLogo.addEventListener('click', () => {
            document.querySelector('.desktop-icons').style.display = 'none';
            document.querySelector('.dock').style.display = 'none';
            document.getElementById('app-windows').style.display = 'none';
            lockScreen.style.display = 'flex';
            passwordInput.value = '';
            lockError.style.display = 'none';
            passwordInput.focus();
        });

        const unlock = () => {
            if (passwordInput.value === '1234') {
                lockScreen.style.display = 'none';
                document.querySelector('.desktop-icons').style.display = 'flex';
                document.querySelector('.dock').style.display = 'flex';
                document.getElementById('app-windows').style.display = 'block';
            } else {
                lockError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        };

        unlockBtn.addEventListener('click', unlock);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') unlock();
        });
    }
    setupDesktopTerminalGreeting() {
        const lines = [
            "> whoami",
            "Souvik — Code Alchemist 🔥",
            "> status",
            "Currently building awesome UI projects",
            "> mission",
            "Turning caffeine into creative code ☕⚡",
            "> motto",
            "Ship fast. Break limits. Build cool stuff 🚀"
        ];

        const outputEl = document.getElementById("desktop-terminal-output");
        if (!outputEl) return;

        // clear previous content and remove any static cursor left in HTML
        outputEl.innerHTML = '';

        // Create (single) cursor element
        let cursor = document.getElementById("desktop-terminal-cursor");
        if (cursor) cursor.remove(); // remove static if present
        cursor = document.createElement("span");
        cursor.id = "desktop-terminal-cursor";
        cursor.textContent = "|";
        cursor.style.marginLeft = "4px";
        cursor.style.display = "inline";

        let lineIndex = 0;
        let charIndex = 0;

        const typeLine = () => {
            if (lineIndex >= lines.length) {
                // after finishing, append cursor at end of last typed line
                const last = outputEl.lastElementChild;
                if (last && !last.contains(cursor)) last.appendChild(cursor);
                return;
            }

            const currentLine = lines[lineIndex];

            // Ensure a line div exists for this index
            let lineDiv = outputEl.children[lineIndex];
            if (!lineDiv) {
                lineDiv = document.createElement("div");
                outputEl.appendChild(lineDiv);
            }

            // Update visible text
            const visible = currentLine.slice(0, charIndex);
            // Set text node (preserve cursor node)
            if (lineDiv.firstChild && lineDiv.firstChild.nodeType === Node.TEXT_NODE) {
                lineDiv.firstChild.textContent = visible;
            } else {
                // remove any children and add text node only (cursor appended separately)
                lineDiv.textContent = visible;
            }

            // Move cursor into the current line (appending moves it from previous line)
            if (!lineDiv.contains(cursor)) lineDiv.appendChild(cursor);

            charIndex++;

            if (charIndex <= currentLine.length) {
                setTimeout(typeLine, 70); // typing speed
            } else {
                // Done this line: lock it and move to next
                lineIndex++;
                charIndex = 0;
                setTimeout(typeLine, 450); // small pause between lines
            }

            // auto-scroll
            outputEl.scrollTop = outputEl.scrollHeight;
        };

        typeLine();

        // Blink handled by CSS animation on #desktop-terminal-cursor (no JS interval needed)
    }

    setupHelpTerminal() {
        const helpWindow = document.getElementById("help-terminal");
        const helpHeader = helpWindow.querySelector(".terminal-header");
        const helpClose = document.getElementById("help-close");
        const helpMin = document.getElementById("help-min");
        const helpMax = document.getElementById("help-max");

        // Restore visibility from session storage
        helpWindow.style.display =
            sessionStorage.getItem("helpVisible") === "false" ? "none" : "block";

        helpClose.addEventListener("click", () => {
            helpWindow.style.display = "none";
            sessionStorage.setItem("helpVisible", "false");
        });

        helpMin.addEventListener("click", () => {
            helpWindow.classList.toggle("minimized");
        });

        helpMax.addEventListener("click", () => {
            helpWindow.classList.toggle("maximized");
        });

        // Basic drag
        let dragging = false;
        let offsetX = 0, offsetY = 0;

        helpHeader.addEventListener("mousedown", (e) => {
            dragging = true;
            offsetX = e.clientX - helpWindow.getBoundingClientRect().left;
            offsetY = e.clientY - helpWindow.getBoundingClientRect().top;
        });

        document.addEventListener("mousemove", (e) => {
            if (!dragging) return;
            helpWindow.style.left = `${e.clientX - offsetX}px`;
            helpWindow.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener("mouseup", () => dragging = false);
    }



    setupDraggableTerminal() {
        const terminal = document.getElementById("desktop-terminal");
        const header = document.getElementById("desktop-terminal-header");

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - terminal.offsetLeft;
            offsetY = e.clientY - terminal.offsetTop;
            header.style.cursor = "grabbing";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            terminal.style.left = e.clientX - offsetX + "px";
            terminal.style.top = e.clientY - offsetY + "px";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            header.style.cursor = "grab";
        });
    }

    makeHelpTerminalDraggable() {
        const helpTerminal = document.getElementById("help-terminal");
        const header = document.getElementById("help-terminal-header");

        let offsetX, offsetY, isDown = false;

        header.addEventListener("mousedown", (e) => {
            isDown = true;
            offsetX = e.clientX - helpTerminal.offsetLeft;
            offsetY = e.clientY - helpTerminal.offsetTop;
            header.style.cursor = "grabbing";
        });

        document.addEventListener("mouseup", () => {
            isDown = false;
            header.style.cursor = "grab";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            helpTerminal.style.left = `${e.clientX - offsetX}px`;
            helpTerminal.style.top = `${e.clientY - offsetY}px`;
            helpTerminal.style.bottom = "auto";
            helpTerminal.style.right = "auto";
        });
    }


    startBootSequence() {
        const bootOverlay = document.getElementById('boot-overlay');
        const bootLog = document.getElementById('boot-log');
        const bootLogo = document.getElementById('boot-logo');

        if (!bootOverlay || !bootLog) {
            // no overlay in DOM — start immediately
            this.onBootComplete();
            return;
        }

        // Boot messages (hybrid: friendly + technical)
        const messages = [
            { t: 'Initializing kernel modules...', type: 'info' },
            { t: 'Mounting virtual filesystem...', type: 'info' },
            { t: 'Loading user profile...', type: 'info' },
            { t: 'Starting network manager...', type: 'info' },
            { t: 'Checking remote endpoints...', type: 'info' },
            { t: 'Authenticating identity provider...', type: 'info' },
            { t: 'Loading UI renderer...', type: 'info' },
            { t: 'Applying user preferences...', type: 'info' },
            { t: 'Starting Terminal service...', type: 'info' },
            { t: 'Launching desktop environment...', type: 'info' },
            { t: 'Finalizing boot sequence', type: 'info' },
        ];

        // small random failures/ok for realism (will not be fatal)
        const extras = [
            { t: 'GPU optimization patch applied', type: 'ok' },
            { t: 'Telemetry disabled', type: 'ok' },
            { t: 'Legacy driver found (ignored)', type: 'fail' },
            { t: 'Cache warm-up complete', type: 'ok' },
        ];

        let i = 0;

        const appendLine = (text, cls = 'boot-info') => {
            const div = document.createElement('div');
            div.className = cls;
            div.textContent = text;
            bootLog.appendChild(div);
            bootLog.scrollTop = bootLog.scrollHeight;
        };

        // sequence typing effect for each message (fast)
        const typeMessage = (msg, cls, cb) => {
            let idx = 0;
            const el = document.createElement('div');
            el.className = cls;
            bootLog.appendChild(el);

            const tick = () => {
                if (idx <= msg.length) {
                    el.textContent = msg.slice(0, idx);
                    bootLog.scrollTop = bootLog.scrollHeight;
                    idx++;
                    setTimeout(tick, 10 + Math.random() * 25);
                } else {
                    if (cb) cb();
                }
            };
            tick();
        };

        const step = () => {
            if (i < messages.length) {
                const m = messages[i];
                typeMessage(m.t, 'boot-info', () => {
                    // after typing this line, possibly insert an extra line
                    if (Math.random() < 0.28) {
                        const ex = extras[Math.floor(Math.random() * extras.length)];
                        const cls = ex.type === 'ok' ? 'boot-ok' : (ex.type === 'fail' ? 'boot-fail' : 'boot-info');
                        setTimeout(() => appendLine('↳ ' + ex.t, cls), 80 + Math.random() * 220);
                    }
                    i++;
                    // small variable pause between messages
                    setTimeout(step, 120 + Math.random() * 260);
                });
            } else {
                // final messages & finish
                setTimeout(() => {
                    appendLine('boot: system ready ✔', 'boot-ok');
                    appendLine('Welcome — desktop will appear shortly.', 'boot-info');

                    // tiny delay then fade
                    setTimeout(() => {
                        bootOverlay.classList.add('boot-hide');
                        // allow CSS transition to finish, then remove from DOM and start desktop features
                        setTimeout(() => {
                            bootOverlay.remove();
                            this.onBootComplete();
                        }, 650);
                    }, 900);
                }, 350);
            }
        };

        // start tiny initial lines, then main loop
        appendLine('Booting hybrid system...', 'boot-info');
        setTimeout(step, 350);
    }


    onBootComplete() {
        // Ensure menu clock is active
        this.updateTime();

        // Initialize desktop terminal greeting if available
        if (typeof this.setupDesktopTerminalGreeting === 'function') {
            this.setupDesktopTerminalGreeting();
        }

        // Enable draggable terminal once boot is complete (support both names)
        if (typeof this.makeTerminalDraggable === 'function') {
            this.makeTerminalDraggable();
        } else if (typeof this.setupDraggableTerminal === 'function') {
            this.setupDraggableTerminal();
        }

        if (typeof this.makeHelpTerminalDraggable === 'function') {
            this.makeHelpTerminalDraggable();
        }


        // Optional: Boot completion sound (commented)
        // const audio = new Audio('boot-complete.mp3');
        // audio.volume = 0.25;
        // audio.play().catch(() => {});
    }

    // inside class MacOSPortfolio:

    setupMobileUI() {
        this.mobileUI = document.getElementById('mobile-ui');
        this.mobileList = document.getElementById('mobile-app-list');
        this.mobilePage = document.getElementById('mobile-page');
        this.mobilePageContent = document.getElementById('mobile-page-content');
        this.mobileCloseBtn = document.getElementById('mobile-close-page');
        this.mobileBackBtn = document.getElementById('mobile-back');

        if (!this.mobileUI || !this.mobileList) return;

        const appsSource = this.apps && Object.keys(this.apps).length ? this.apps : null;
        const items = appsSource
            ? Object.entries(this.apps)
            : Array.from(document.querySelectorAll('.dock-item')).map(el => {
                const id = el.dataset.app;
                return [id, { title: id, content: '' }];
            });

        this.mobileList.innerHTML = '';

        items.forEach(([appId, appData]) => {
            const title = appData?.title ?? appId;
            const sub = appData?.subtitle ?? "";

            const card = document.createElement('button');
            card.className = 'mobile-card';
            card.type = 'button';
            card.dataset.app = appId;
            card.innerHTML = `
            <div class="card-icon">${this._mobileIconForApp(appId)}</div>
            <div class="card-body">
                <div class="card-title">${title}</div>
                <div class="card-sub">${sub}</div>
            </div>
        `;
            card.addEventListener('click', () => this.openMobileApp(appId));

            this.mobileList.appendChild(card);
        });

        if (this.mobileCloseBtn)
            this.mobileCloseBtn.addEventListener('click', () => this.closeMobilePage());

        if (this.mobileBackBtn)
            this.mobileBackBtn.addEventListener('click', () => {
                if (this.mobilePage?.classList.contains('open'))
                    this.closeMobilePage();
            });

        this.checkMobileUI();
        window.addEventListener('resize', () => this.checkMobileUI());
    }

    _mobileIconForApp(appId) {
        const map = {
            about: '👤',
            projects: '📁',
            skills: '💻',
            resume: '📄',
            contact: '✉️',
            github: '🐙',
            linkedin: '🔗',
            trash: '🗑️',
            terminal: '›'
        };
        return map[appId] || '📦';
    }

    checkMobileUI() {
        const isMobile = window.innerWidth <= 767;

        if (isMobile) {
            this.mobileUI?.classList.add('js-active');
            this.mobileUI?.removeAttribute('aria-hidden');

            document.querySelector('.desktop-icons').style.display = 'none';
            document.querySelector('.dock').style.display = 'none';
            document.getElementById('app-windows').style.display = 'none';
            document.getElementById('desktop-terminal').style.display = 'none';
        }
        else {
            this.mobileUI?.classList.remove('js-active');
            this.mobileUI?.setAttribute('aria-hidden', 'true');

            document.querySelector('.desktop-icons').style.display = 'flex';
            document.querySelector('.dock').style.display = 'flex';
            document.getElementById('app-windows').style.display = 'block';
            document.getElementById('desktop-terminal').style.display = 'block';
        }
    }


}

const portfolio = new MacOSPortfolio();