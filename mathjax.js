// mathjax.js - MathJax Rendering Logic
import { preview } from './dom.js'; // Import preview element for error display

/**
 * 处理 MathJax 渲染时发生的错误。
 * @param {Error} err MathJax 抛出的错误对象。
 */
function handleMathJaxError(err) {
    console.error('MathJax typesetting error: ', err);
    if (preview) {
        // 在预览区域追加 MathJax 错误信息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message alert alert-danger mt-2 animate__animated animate__fadeIn'; // 添加动画
        errorDiv.textContent = `MathJax 渲染时遇到问题: ${err.message || '未知错误'}`;
        preview.appendChild(errorDiv); // 追加错误信息而不是替换现有内容
        preview.classList.remove('empty'); // 确保预览区域可见
    } else {
        console.error("Preview element not found in handleMathJaxError.");
    }
}

/**
 * 在指定的 HTML 元素内渲染 MathJax 公式。
 * @param {HTMLElement} element 包含潜在 MathJax 公式的元素。
 * @param {string} [context=''] 描述渲染上下文的字符串，用于错误日志。
 */
export function renderMathInElement(element, context = '') {
    if (!element) {
        console.error(`Target element not provided for MathJax rendering${context ? ` in ${context}` : ''}.`);
        return;
    }
    // 检查 MathJax 是否已加载且可用
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([element]).catch(err => {
            console.error(`MathJax typesetting failed${context ? ` in ${context}` : ''}:`, err);
            handleMathJaxError(err); // 使用统一的错误处理
        });
    } else {
        console.error(`MathJax is not loaded or typesetPromise is not available${context ? ` when trying to render in ${context}` : ''}.`);
        // 可以在元素内显示一个更友好的提示，但这可能会覆盖原有内容
        // Consider adding a non-intrusive warning if MathJax fails to load
        if (preview && element === preview) { // 只在主预览区显示加载失败信息
             const errorDiv = document.createElement('div');
             errorDiv.className = 'error-message alert alert-warning mt-2';
             errorDiv.textContent = `MathJax 核心未能加载，公式无法显示。请检查网络连接或稍后重试。`;
             preview.appendChild(errorDiv);
             preview.classList.remove('empty');
        }
    }
}

/**
 * 准备并渲染包含 LaTeX 代码的预览。
 * @param {string} latexCode LaTeX 代码字符串。
 */
export function renderLatexPreview(latexCode) {
    if (!preview) {
        console.error("Preview element not found in renderLatexPreview.");
        return;
    }
    if (latexCode.trim() !== '') {
        // 使用 div 包裹以应用样式和确保块级显示
        preview.innerHTML = `<div class="mathjax-wrapper">$$${latexCode}$$</div>`;
        preview.classList.remove('empty');
        renderMathInElement(preview, 'LaTeX Preview'); // 调用通用渲染函数
    } else {
        preview.innerHTML = ''; // 清空内容
        preview.classList.add('empty');
    }
}