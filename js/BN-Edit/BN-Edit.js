// Element Inspector - Dark Theme
// Ctrl+Click any element to inspect it

(function() {
    // State variables
    let highlightedElement = null;
    let infoPopup = null;

    // Handle element inspection
    function inspectElement(element, clientX, clientY) {
        // Remove previous highlights
        if (highlightedElement) {
            highlightedElement.style.outline = '';
        }

        // Highlight new element with modern outline
        element.style.outline = '2px solid rgba(79, 70, 229, 0.7)';
        element.style.outlineOffset = '2px';
        highlightedElement = element;

        // Remove previous popup if exists
        if (infoPopup) {
            document.body.removeChild(infoPopup);
        }

        // Create new popup with dark theme
        infoPopup = document.createElement('div');
        infoPopup.style.position = 'fixed';
        infoPopup.style.zIndex = '9999999';
        infoPopup.style.backgroundColor = '#1f2937';
        infoPopup.style.border = '1px solid #374151';
        infoPopup.style.borderRadius = '8px';
        infoPopup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
        infoPopup.style.padding = '16px';
        infoPopup.style.maxWidth = '320px';
        infoPopup.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        infoPopup.style.fontSize = '14px';
        infoPopup.style.color = '#e5e7eb';
        infoPopup.style.lineHeight = '1.5';

        // Position the popup intelligently
        positionPopup(infoPopup, clientX, clientY);

        // Add content to popup
        infoPopup.innerHTML = generatePopupContent(element);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '8px';
        closeBtn.style.right = '8px';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#9ca3af';
        closeBtn.style.width = '24px';
        closeBtn.style.height = '24px';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.borderRadius = '4px';
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = '#374151';
            closeBtn.style.color = '#f3f4f6';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
            closeBtn.style.color = '#9ca3af';
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.body.removeChild(infoPopup);
            infoPopup = null;
            if (highlightedElement) {
                highlightedElement.style.outline = '';
                highlightedElement = null;
            }
        });
        infoPopup.appendChild(closeBtn);

        document.body.appendChild(infoPopup);
    }

    function positionPopup(popup, clickX, clickY) {
        const popupWidth = 320;
        const popupHeight = 240;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let top = clickY - popupHeight - 15;
        let left = Math.min(clickX - popupWidth / 2, windowWidth - popupWidth - 15);
        left = Math.max(left, 15);

        if (top < 15) {
            top = clickY + 15;
            if (top + popupHeight > windowHeight - 15) {
                popup.style.maxHeight = (windowHeight - top - 30) + 'px';
                popup.style.overflowY = 'auto';
            }
        }

        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
    }

    function generatePopupContent(element) {
        let content = `
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <div style="background-color: #4f46e5; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                        ${element.tagName.toLowerCase()}
                    </div>
                    ${element.id ? `<div style="background-color: #374151; color: #a5b4fc; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">#${element.id}</div>` : ''}
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                    <div style="background-color: #111827; padding: 8px; border-radius: 4px;">
                        <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">WIDTH</div>
                        <div style="font-weight: 500;">${element.offsetWidth}px</div>
                    </div>
                    <div style="background-color: #111827; padding: 8px; border-radius: 4px;">
                        <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">HEIGHT</div>
                        <div style="font-weight: 500;">${element.offsetHeight}px</div>
                    </div>
                </div>
        `;

        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            content += `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">CLASSES</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${classes.map(c => `<span style="background-color: #374151; color: #a5b4fc; padding: 2px 8px; border-radius: 4px; font-size: 12px;">.${c}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        const cssRules = findCSSRules(element);
        if (cssRules.length > 0) {
            const uniqueSources = new Set();
            cssRules.forEach(rule => {
                const source = rule.parentStyleSheet.href || 'inline styles';
                uniqueSources.add(source);
            });

            content += `
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">STYLES FROM</div>
                    <div style="background-color: #111827; border-radius: 6px; overflow: hidden;">
            `;

            Array.from(uniqueSources).forEach((source, i) => {
                const shortSource = source.replace(/^https?:\/\/[^/]+/, '');
                content += `
                    <div style="padding: 8px 12px; ${i !== uniqueSources.size - 1 ? 'border-bottom: 1px solid #374151;' : ''}">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="color: #a5b4fc; font-size: 12px;">${shortSource || 'inline styles'}</div>
                        </div>
                    </div>
                `;
            });

            content += `</div></div>`;
        }

        return content;
    }

    function findCSSRules(element) {
        const rules = [];
        const sheets = document.styleSheets;

        for (let i = 0; i < sheets.length; i++) {
            try {
                const sheet = sheets[i];
                if (!sheet.cssRules) continue;

                for (let j = 0; j < sheet.cssRules.length; j++) {
                    const rule = sheet.cssRules[j];
                    try {
                        if (element.matches(rule.selectorText)) {
                            rules.push(rule);
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        return rules;
    }

    // Event listener for Ctrl+Click
    document.addEventListener('click', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            inspectElement(e.target, e.clientX, e.clientY);
        }
    }, true);

    console.log('Element Inspector loaded. Ctrl+Click elements to inspect them.');
})();
