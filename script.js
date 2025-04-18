// script.js (Main Application Logic)
import { config } from './config.js';
import * as dom from './dom.js'; // Import all DOM elements as an object
import * as ui from './ui.js';
import * as mathjax from './mathjax.js';
import * as api from './api.js';
import * as math from './math.js';
import * as plot from './plot.js';

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
    // 注意：原代码是监听 nextElementSibling，这里直接监听 dropdown 本身可能更健壮
    if (dom.mathOpsDropdown) {
        const dropdownMenu = dom.mathOpsDropdown.nextElementSibling;
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', (event) => {
                const target = event.target.closest('.dropdown-item');
                if (!target) return;

                event.preventDefault();
                const operation = target.getAttribute('data-op');
                const latexInput = dom.editor?.value ?? '';
                const variable = dom.variableInput?.value.trim() || 'x'; // Default variable 'x'

                if (operation) {
                    math.processMathOperation(operation, latexInput, variable);
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