// Loader implementation that uses session storage to track visited pages
function initLoader(pageName) {
    // Skip loader for tech news page
    if (pageName === 'technews') {
        return;
    }
    
    // Check if this page has been visited in this session
    const visitedPages = JSON.parse(sessionStorage.getItem('visitedPages') || '{}');
    
    // If page has been visited before in this session, skip the loader
    if (visitedPages[pageName]) {
        return;
    }
    
    // Mark this page as visited
    visitedPages[pageName] = true;
    sessionStorage.setItem('visitedPages', JSON.stringify(visitedPages));
    
    // Create style element with all loader styles
    const style = document.createElement('style');
    style.textContent = `
        /* Hide the page content immediately until loader is ready */
        body {
            visibility: hidden;
        }
        
        #initialLoader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #050505;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            visibility: visible !important;
        }
        
        /* Rest of your CSS remains the same */
        .tech-loader {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .loader-ring {
            position: absolute;
            border-radius: 50%;
            border: 2px solid transparent;
        }
        
        .outer {
            width: 250px;
            height: 250px;
            border-top: 2px solid #3a86ff;
            border-right: 2px solid transparent;
            border-bottom: 2px solid #ff006e;
            border-left: 2px solid transparent;
            animation: loader-spin 3s linear infinite;
        }
        
        .middle {
            width: 200px;
            height: 200px;
            border-top: 2px solid transparent;
            border-right: 2px solid #00f5d4;
            border-bottom: 2px solid transparent;
            border-left: 2px solid #ff006e;
            animation: loader-spin 2s linear infinite reverse;
        }
        
        .inner {
            width: 150px;
            height: 150px;
            border-top: 2px solid #00f5d4;
            border-right: 2px solid transparent;
            border-bottom: 2px solid #3a86ff;
            border-left: 2px solid transparent;
            animation: loader-spin 1.5s linear infinite;
        }
        
        .loading-content {
            text-align: center;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .glitch-text {
            font-family: 'Inter', sans-serif;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 3px;
            position: relative;
            text-shadow: 0 0 10px rgba(0, 200, 255, 0.8);
            animation: loader-glitch 3s infinite;
        }
        
        .glitch-text::before,
        .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .glitch-text::before {
            left: 2px;
            text-shadow: -2px 0 #ff006e;
            animation: loader-glitch-1 2s infinite linear alternate-reverse;
        }
        
        .glitch-text::after {
            left: -2px;
            text-shadow: 2px 0 #00f5d4;
            animation: loader-glitch-2 3s infinite linear alternate-reverse;
        }
        
        .loading-bar {
            width: 200px;
            height: 3px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            margin: 15px 0;
            overflow: hidden;
        }
        
        .loading-progress {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #3a86ff, #ff006e);
            animation: loader-progress 2s ease-in-out forwards;
        }
        
        .binary-text {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            opacity: 0.7;
            letter-spacing: 1px;
            animation: loader-flicker 2s infinite alternate;
        }
        
        @keyframes loader-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes loader-progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        
        @keyframes loader-glitch {
            0%, 100% { opacity: 1; transform: translateX(0); filter: brightness(1); }
            7% { opacity: 0.75; transform: translateX(-2px); filter: brightness(1.2); }
            10% { opacity: 1; transform: translateX(0); filter: brightness(1); }
            27% { opacity: 1; transform: translateX(0); filter: brightness(1); }
            30% { opacity: 0.75; transform: translateX(2px); filter: brightness(1.2); }
            35% { opacity: 1; transform: translateX(0); filter: brightness(1); }
        }
        
        @keyframes loader-glitch-1 {
            0% { clip-path: inset(20% 0 30% 0); }
            20% { clip-path: inset(60% 0 10% 0); }
            40% { clip-path: inset(40% 0 50% 0); }
            60% { clip-path: inset(80% 0 10% 0); }
            80% { clip-path: inset(50% 0 60% 0); }
            100% { clip-path: inset(10% 0 90% 0); }
        }
        
        @keyframes loader-glitch-2 {
            0% { clip-path: inset(30% 0 20% 0); }
            20% { clip-path: inset(10% 0 60% 0); }
            40% { clip-path: inset(50% 0 40% 0); }
            60% { clip-path: inset(10% 0 80% 0); }
            80% { clip-path: inset(60% 0 50% 0); }
            100% { clip-path: inset(90% 0 10% 0); }
        }
        
        @keyframes loader-flicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 0.9; }
            20%, 24%, 55% { opacity: 0.2; }
        }        
        `;
    
    // Add the style to the document head immediately
    document.head.appendChild(style);
    
    // Create loader element
    const loader = document.createElement('div');
    loader.id = 'initialLoader';
    loader.innerHTML = `
        <div class="tech-loader">
            <div class="loader-ring outer"></div>
            <div class="loader-ring middle"></div>
            <div class="loader-ring inner"></div>
            <div class="loading-content">
                <div class="glitch-text" data-text="TECHZEN">TECHZEN</div>
                <div class="loading-bar">
                    <div class="loading-progress"></div>
                </div>
                <div class="binary-text">01100100 01100001 01110100 01100001</div>
            </div>
        </div>
    `;
    
    // Add loader to body
    document.write(loader.outerHTML);
    
    // Remove loader after page loads
    window.addEventListener('load', function() {
        setTimeout(() => {
            const loaderElement = document.getElementById('initialLoader');
            if (loaderElement) {
                loaderElement.style.transition = 'opacity 0.8s';
                loaderElement.style.opacity = '0';
                setTimeout(() => {
                    loaderElement.remove();
                    document.body.style.visibility = 'visible';
                    // Also clean up the style element
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 800);
            }
        }, 2000);
    });
}