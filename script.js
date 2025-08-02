// script.js (Main Application Logic)
import * as dom from './dom.js'; // Import all DOM elements as an object
import * as ui from './ui.js';
import * as mathjax from './mathjax.js';
import * as api from './api.js';
import * as math from './math.js';
import * as plot from './plot.js';
import { getConfig, saveUserConfig, resetToDefaultConfig } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Event Listeners ---

    // 解析按钮事件
    if (dom.parseBtn) {
        dom.parseBtn.addEventListener('click', () => {
            const latexCode = dom.editor?.value ?? '';
            mathjax.renderLatexPreview(latexCode);
        });
    } else {
        console.error("Parse button not found.");
    }

    // 调用大模型按钮事件
    if (dom.callModelBtn) {
        dom.callModelBtn.addEventListener('click', () => {
            const userQuery = dom.modelQueryInput?.value ?? '';
            const latexContent = dom.editor?.value ?? '';
            api.callLargeLanguageModel(userQuery, latexContent);
        });
    } else {
        console.error("Call model button not found.");
    }

    // 数学运算下拉菜单事件 (事件委托)
    if (dom.mathOpsDropdown) {
        const dropdownMenu = dom.mathOpsDropdown.nextElementSibling;
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', (event) => {
                const target = event.target.closest('.dropdown-item');
                if (!target) return;

                event.preventDefault();
                const operation = target.getAttribute('data-op');
                const latexInput = dom.editor?.value ?? '';
                const variable = dom.variableInput?.value.trim() || 'x';

                if (operation) {
                    // 检查是否需要高级配置面板
                    const advancedOps = ['substitute', 'evaluate'];
                    if (advancedOps.includes(operation)) {
                        showAdvancedMathPanel(operation, latexInput, variable);
                    } else {
                        math.processMathOperation(operation, latexInput, variable);
                    }
                } else {
                    console.error("Math operation type not found on dropdown item.");
                }
            });
        } else {
            console.error("Math operations dropdown menu not found.");
        }
    } else {
        console.error("Math operations dropdown button not found.");
    }


    // 函数绘图按钮点击事件
    if (dom.plotFunctionBtn) {
        dom.plotFunctionBtn.addEventListener('click', () => {
            if (dom.plotConfigPanel && dom.functionPlotDiv) {
                // 显示绘图配置面板
                dom.plotConfigPanel.classList.remove('d-none', 'animate__fadeOut');
                dom.plotConfigPanel.classList.add('animate__animated', 'animate__fadeIn'); // 添加 animate.css 类
                dom.functionPlotDiv.classList.add('d-none'); // 隐藏旧的绘图区域
            } else {
                console.error("Plot config panel or function plot div not found.");
            }
        });
    } else {
        console.error("Plot function button not found.");
    }

    // 关闭配置面板按钮事件
    if (dom.closePlotConfigBtn) {
        dom.closePlotConfigBtn.addEventListener('click', () => {
            if (dom.plotConfigPanel) {
                // 隐藏绘图配置面板
                dom.plotConfigPanel.classList.remove('animate__fadeIn');
                dom.plotConfigPanel.classList.add('animate__fadeOut');
                // 等待动画完成后再添加 d-none
                setTimeout(() => {
                    dom.plotConfigPanel.classList.add('d-none');
                }, 500); // 动画持续时间
            } else {
                console.error("Plot config panel not found for closing.");
            }
        });
    } else {
        console.error("Close plot config button not found.");
    }

    // 生成图像按钮事件
    if (dom.generatePlotBtn) {
        dom.generatePlotBtn.addEventListener('click', () => {
            const latexExpression = dom.editor?.value.trim() ?? '';
            if (!latexExpression) {
                ui.showPreviewMessage('<div class="warning-message alert alert-warning animate__animated animate__fadeIn">请输入 LaTeX 函数表达式后再生成图像。</div>');
                return;
            }
            plot.plotLatexFunction(latexExpression);
        });
    } else {
        console.error("Generate plot button not found.");
    }

    // 高级数学面板显示函数
    function showAdvancedMathPanel(operation, latexInput, variable) {
        const panel = document.getElementById('advancedMathPanel');
        const panelHeader = panel.querySelector('.card-header');
        const substitutionVarGroup = document.getElementById('substitutionVar').closest('.col');
        const evaluationPointGroup = document.getElementById('evaluationPoint').closest('.col');
        
        // 隐藏所有输入框
        substitutionVarGroup.style.display = 'none';
        evaluationPointGroup.style.display = 'none';
        
        // 根据操作类型设置面板标题和显示相应输入框
        switch (operation) {
            case 'substitute':
                panelHeader.textContent = '变量替换配置';
                substitutionVarGroup.style.display = 'block';
                document.getElementById('substitutionVar').placeholder = '例如：x=2';
                break;
            case 'evaluate':
                panelHeader.textContent = '数值计算配置';
                evaluationPointGroup.style.display = 'block';
                document.getElementById('evaluationPoint').placeholder = '例如：x=2';
                break;
        }
        
        // 存储当前操作信息
        panel.dataset.operation = operation;
        panel.dataset.latexInput = latexInput;
        panel.dataset.variable = variable;
        
        // 显示面板
        panel.classList.remove('d-none', 'animate__fadeOut');
        panel.classList.add('animate__animated', 'animate__fadeIn');
    }
    
    // 关闭高级数学面板
    function closeAdvancedMathPanel() {
        const panel = document.getElementById('advancedMathPanel');
        panel.classList.remove('animate__fadeIn');
        panel.classList.add('animate__fadeOut');
        setTimeout(() => {
            panel.classList.add('d-none');
        }, 500);
    }
    
    // 执行高级运算
    function executeAdvancedMathOperation() {
        const panel = document.getElementById('advancedMathPanel');
        const operation = panel.dataset.operation;
        const latexInput = panel.dataset.latexInput;
        const variable = panel.dataset.variable;
        
        if (operation && latexInput) {
            math.processMathOperation(operation, latexInput, variable);
            closeAdvancedMathPanel();
        }
    }
    
    // 绑定高级数学面板事件
    document.getElementById('closeAdvancedBtn')?.addEventListener('click', closeAdvancedMathPanel);
    document.getElementById('executeAdvancedBtn')?.addEventListener('click', executeAdvancedMathOperation);

    // API配置面板事件
    if (dom.settingsBtn) {
        dom.settingsBtn.addEventListener('click', () => {
            if (dom.apiConfigPanel) {
                // 加载当前配置到表单
                const currentConfig = getConfig();
                if (dom.apiBaseUrl) dom.apiBaseUrl.value = currentConfig.apiEndpoint || '';
                if (dom.apiModel) dom.apiModel.value = currentConfig.model || '';
                if (dom.apiKey) dom.apiKey.value = currentConfig.apiKey || '';
                
                // 显示API配置面板
                dom.apiConfigPanel.classList.remove('d-none', 'animate__fadeOut');
                dom.apiConfigPanel.classList.add('animate__animated', 'animate__fadeIn');
            }
        });
    }

    // 关闭API配置面板
    if (dom.closeApiConfigBtn) {
        dom.closeApiConfigBtn.addEventListener('click', () => {
            if (dom.apiConfigPanel) {
                dom.apiConfigPanel.classList.remove('animate__fadeIn');
                dom.apiConfigPanel.classList.add('animate__fadeOut');
                setTimeout(() => {
                    dom.apiConfigPanel.classList.add('d-none');
                }, 500);
            }
        });
    }

    // 保存API配置
    if (dom.saveApiConfigBtn) {
        dom.saveApiConfigBtn.addEventListener('click', () => {
            const newConfig = {};
            if (dom.apiBaseUrl?.value.trim()) newConfig.apiEndpoint = dom.apiBaseUrl.value.trim();
            if (dom.apiModel?.value.trim()) newConfig.model = dom.apiModel.value.trim();
            if (dom.apiKey?.value.trim()) newConfig.apiKey = dom.apiKey.value.trim();
            
            if (Object.keys(newConfig).length > 0) {
                const success = saveUserConfig(newConfig);
                if (success) {
                    ui.showPreviewMessage('<div class="success-message alert alert-success animate__animated animate__fadeIn">API配置已保存成功！</div>');
                    // 关闭面板
                    dom.apiConfigPanel.classList.remove('animate__fadeIn');
                    dom.apiConfigPanel.classList.add('animate__fadeOut');
                    setTimeout(() => {
                        dom.apiConfigPanel.classList.add('d-none');
                    }, 500);
                } else {
                    ui.showPreviewMessage('<div class="error-message alert alert-danger animate__animated animate__fadeIn">保存配置失败，请重试。</div>');
                }
            } else {
                ui.showPreviewMessage('<div class="warning-message alert alert-warning animate__animated animate__fadeIn">请至少填写一个配置项。</div>');
            }
        });
    }

    // 重置API配置
    if (dom.resetApiConfigBtn) {
        dom.resetApiConfigBtn.addEventListener('click', () => {
            resetToDefaultConfig();
            // 清空表单
            if (dom.apiBaseUrl) dom.apiBaseUrl.value = '';
            if (dom.apiModel) dom.apiModel.value = '';
            if (dom.apiKey) dom.apiKey.value = '';
            ui.showPreviewMessage('<div class="info-message alert alert-info animate__animated animate__fadeIn">已重置为默认配置。</div>');
        });
    }

  // --- Initialization ---
    // 触发容器入场动画
    ui.triggerContainerAnimation(dom.container);

    // 暗夜主题初始化
    (function() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        const root = document.documentElement;
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = storedTheme ? storedTheme : (prefersDark ? 'dark' : 'light');
        root.setAttribute('data-theme', theme);
        if (toggleBtn) toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                root.setAttribute('data-theme', newTheme);
                if (toggleBtn) toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            }
        });
        // 切换按钮点击事件
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = root.getAttribute('data-theme');
                const newTheme = current === 'dark' ? 'light' : 'dark';
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
        }
    })();

    // 可以在这里添加其他初始化代码，例如加载默认 LaTeX 等
    console.log("Application initialized with modules.");

}); // End DOMContentLoaded