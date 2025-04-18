// ui.js - UI Utility Functions
import { preview } from './dom.js'; // Import necessary DOM elements

/**
 * 在预览区域显示 HTML 内容。
 * @param {string} htmlContent 要显示的 HTML 字符串。
 * @param {boolean} [isLoading=false] 是否显示加载指示器。
 */
export function showPreviewMessage(htmlContent, isLoading = false) {
    if (!preview) {
        console.error("Preview element not found in showPreviewMessage.");
        return;
    }
    preview.innerHTML = htmlContent;
    if (isLoading) {
        // 添加 Bootstrap 微调器
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border spinner-border-sm ms-2'; // 添加 margin-left
        spinner.setAttribute('role', 'status');
        spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
        // 尝试附加到消息文本后面，如果可能的话
        const messageElement = preview.firstChild; // 假设消息是第一个子元素
        if (messageElement && messageElement.nodeType === Node.ELEMENT_NODE) {
             messageElement.appendChild(spinner);
        } else {
             preview.appendChild(spinner); // 否则直接附加到 preview
        }
    }
    preview.classList.remove('empty');
}

/**
 * 在预览区域显示加载消息。
 * @param {string} message 加载时显示的消息文本。
 */
export function showLoadingMessage(message) {
    showPreviewMessage(`<div class="loading-message animate__animated animate__fadeIn">${message}</div>`, true);
}

/**
 * 在指定的 DOM 元素内显示加载消息。
 * @param {HTMLElement} element 要显示加载消息的元素。
 * @param {string} message 加载时显示的消息文本。
 */
export function showLoadingMessageForElement(element, message) {
    if (!element) {
        console.error("Target element not provided in showLoadingMessageForElement.");
        return;
    }
    element.innerHTML = `<div class="loading-message animate__animated animate__fadeIn">${message} <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
}


/**
 * 在文本区域的光标处插入文本。
 * @param {HTMLTextAreaElement} textarea 目标文本区域元素。
 * @param {string} textToInsert 要插入的文本。
 */
export function insertTextAtCursor(textarea, textToInsert) {
    if (!textarea || typeof textarea.value === 'undefined') {
        console.error("insertTextAtCursor: Invalid textarea element provided.");
        return;
    }
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = textarea.value;
    // 插入文本
    textarea.value = currentText.substring(0, startPos) + textToInsert + currentText.substring(endPos);
    // 将光标移动到插入文本之后
    const newCursorPos = startPos + textToInsert.length;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    textarea.focus(); // 重新聚焦
}

/**
 * 触发容器元素的入场动画（如果 CSS 中定义了）。
 * @param {HTMLElement} containerElement 容器元素。
 */
export function triggerContainerAnimation(containerElement) {
    if (containerElement) {
        // 确保初始状态是隐藏的或移位的，以便动画可见
        // 例如，如果动画是从 translateY(20px) 到 translateY(0)
        // containerElement.style.transform = 'translateY(20px)';
        // containerElement.style.opacity = '0';
        // requestAnimationFrame(() => { // 确保浏览器有时间应用初始样式
             containerElement.style.transform = 'translateY(0)';
             containerElement.style.opacity = '1'; // 假设动画包含透明度
        // });
    } else {
        console.warn("Container element not found for animation initialization.");
    }
}