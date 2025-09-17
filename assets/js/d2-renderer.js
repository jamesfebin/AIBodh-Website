/**
 * D2 Diagram Renderer for Jekyll Blog
 * Automatically converts D2 code blocks to SVG diagrams
 */

class D2Renderer {
    constructor() {
        this.d2ApiUrl = 'https://play.d2lang.com/api';
        this.initializeRenderer();
    }

    initializeRenderer() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.renderAllD2Diagrams());
        } else {
            this.renderAllD2Diagrams();
        }
    }

    async renderAllD2Diagrams() {
        // Find all code blocks with language 'd2'
        const d2CodeBlocks = document.querySelectorAll('pre code.language-d2, pre code.d2');
        
        for (const codeBlock of d2CodeBlocks) {
            await this.renderD2Diagram(codeBlock);
        }
    }

    async renderD2Diagram(codeElement) {
        const d2Code = codeElement.textContent.trim();
        
        if (!d2Code) {
            console.warn('Empty D2 code block found');
            return;
        }

        try {
            // Show loading indicator
            const loadingDiv = this.createLoadingIndicator();
            codeElement.parentElement.parentElement.insertBefore(loadingDiv, codeElement.parentElement);

            // Render diagram using D2 API
            const svgContent = await this.renderWithD2API(d2Code);
            
            if (svgContent) {
                // Create diagram container
                const diagramContainer = this.createDiagramContainer(svgContent, d2Code);
                
                // Replace the code block with the rendered diagram
                codeElement.parentElement.parentElement.replaceChild(diagramContainer, codeElement.parentElement);
                
                // Remove loading indicator
                if (loadingDiv.parentElement) {
                    loadingDiv.parentElement.removeChild(loadingDiv);
                }
            } else {
                // Remove loading indicator and show error
                if (loadingDiv.parentElement) {
                    loadingDiv.parentElement.removeChild(loadingDiv);
                }
                this.showError(codeElement, 'Failed to render D2 diagram');
            }
        } catch (error) {
            console.error('Error rendering D2 diagram:', error);
            this.showError(codeElement, `Error: ${error.message}`);
        }
    }

    async renderWithD2API(d2Code) {
        try {
            const response = await fetch(`${this.d2ApiUrl}/render`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    script: d2Code,
                    layout: 'dagre',
                    theme: 'default',
                    format: 'svg'
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            return result.svg || result.output;
        } catch (error) {
            console.error('D2 API error:', error);
            // Fallback to local rendering if API fails
            return await this.renderLocally(d2Code);
        }
    }

    async renderLocally(d2Code) {
        // For local rendering, we'll create a simple fallback
        // In a real implementation, you might want to use a local D2 server
        console.warn('Local D2 rendering not implemented, showing code block');
        return null;
    }

    createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'd2-loading';
        loadingDiv.innerHTML = `
            <div class="has-text-centered">
                <div class="button is-loading is-text">Rendering D2 diagram...</div>
            </div>
        `;
        return loadingDiv;
    }

    createDiagramContainer(svgContent, originalCode) {
        const container = document.createElement('div');
        container.className = 'd2-diagram-container';
        
        // Create tabs for switching between diagram and code
        const tabsHtml = `
            <div class="tabs is-boxed is-small">
                <ul>
                    <li class="is-active">
                        <a data-tab="diagram">
                            <span class="icon is-small">
                                <i class="fas fa-project-diagram" aria-hidden="true"></i>
                            </span>
                            <span>Diagram</span>
                        </a>
                    </li>
                    <li>
                        <a data-tab="code">
                            <span class="icon is-small">
                                <i class="fas fa-code" aria-hidden="true"></i>
                            </span>
                            <span>D2 Code</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;

        const diagramHtml = `
            <div class="d2-diagram-content is-active" data-content="diagram">
                <div class="d2-svg-container">
                    ${svgContent}
                </div>
            </div>
        `;

        const codeHtml = `
            <div class="d2-diagram-content" data-content="code" style="display: none;">
                <pre><code class="language-d2">${this.escapeHtml(originalCode)}</code></pre>
            </div>
        `;

        container.innerHTML = tabsHtml + diagramHtml + codeHtml;

        // Add tab switching functionality
        this.addTabSwitching(container);

        return container;
    }

    addTabSwitching(container) {
        const tabs = container.querySelectorAll('[data-tab]');
        const contents = container.querySelectorAll('[data-content]');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');

                // Update active tab
                tabs.forEach(t => t.parentElement.classList.remove('is-active'));
                tab.parentElement.classList.add('is-active');

                // Update active content
                contents.forEach(content => {
                    if (content.getAttribute('data-content') === targetTab) {
                        content.style.display = 'block';
                        content.classList.add('is-active');
                    } else {
                        content.style.display = 'none';
                        content.classList.remove('is-active');
                    }
                });
            });
        });
    }

    showError(codeElement, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification is-danger';
        errorDiv.innerHTML = `
            <button class="delete"></button>
            <strong>D2 Rendering Error:</strong> ${message}
        `;

        // Add close functionality
        errorDiv.querySelector('.delete').addEventListener('click', () => {
            errorDiv.remove();
        });

        codeElement.parentElement.parentElement.insertBefore(errorDiv, codeElement.parentElement);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize D2 renderer when script loads
new D2Renderer();
