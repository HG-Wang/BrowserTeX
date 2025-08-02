// api.js - Handles interaction with the Large Language Model API
import { getConfig } from './config.js';
import { showPreviewMessage, showLoadingMessage, showLoadingMessageForElement } from './ui.js';
import { renderMathInElement } from './mathjax.js';
import { preview } from './dom.js'; // Import preview for rendering

/**
 * 处理 API 响应，检查状态并解析 JSON。
 * @param {Response} response fetch API 的响应对象。
 * @returns {Promise<object>} 解析后的 JSON 数据。
 * @throws {Error} 如果响应状态不是 ok。
 */
async function handleApiResponse(response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // 如果 JSON 解析失败，使用状态文本
            errorData = { error: { message: response.statusText } };
        }
        const errorMessage = errorData?.error?.message || response.statusText || 'Unknown API error';
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
    }
    try {
        return await response.json();
    } catch (e) {
        console.error("API response JSON parsing error:", e);
        throw new Error("Failed to parse API response as JSON.");
    }
}

/**
 * 处理 API 调用过程中发生的网络错误或其他异常。
 * @param {Error} error 捕获到的错误对象。
 * @param {string} apiUrl 使用的 API 端点。
 */
function handleApiError(error, apiUrl) {
    console.error('API call failed:', error);
    const errorDetails = `调用大模型时出错:<br>
    ${error.message}<br>
    请检查:<br>
    1. API 配置 (端点: ${apiUrl}) 是否正确<br>
    2. API 密钥是否有效且有额度<br>
    3. 网络连接是否稳定`;
    showPreviewMessage(`<div class="error-message alert alert-danger animate__animated animate__fadeIn">${errorDetails}</div>`);
}

/**
 * 使用 markdown-it 渲染 Markdown 内容，并触发 MathJax 渲染。
 * @param {string} rawContent 从 API 获取的原始 Markdown 文本。
 */
function renderMarkdownContent(rawContent) {
    if (!preview) {
        console.error("Preview element not found in renderMarkdownContent.");
        return;
    }
    try {
        // 确保 markdown-it 已加载
        if (typeof window.markdownit === 'undefined') {
            console.error("markdown-it library is not loaded.");
            preview.innerHTML = `<div class="error-message alert alert-warning">Markdown 渲染库加载失败。</div><pre>${rawContent}</pre>`; // 显示原始文本
            return;
        }
        const md = window.markdownit({
            html: true, // 允许 HTML 标签
            linkify: true, // 自动转换 URL 为链接
            typographer: true // 启用智能标点替换
        });
        const renderedContent = md.render(rawContent || '*模型未返回有效内容*'); // 提供默认值

        // 使用 showPreviewMessage 更新预览区域
        showPreviewMessage(`<div class="model-response animate__animated animate__fadeIn">${renderedContent}</div>`);

        // 渲染可能包含在 Markdown 中的 MathJax 公式
        renderMathInElement(preview, 'Model Response');

    } catch (error) {
        console.error("Error rendering Markdown:", error);
        showPreviewMessage(`<div class="error-message alert alert-danger">渲染模型响应时出错: ${error.message}</div><pre>${rawContent}</pre>`);
    }
}


/**
 * 调用大语言模型 API。
 * @param {string} userQuery 用户输入的问题。
 * @param {string} latexContent 编辑器中的 LaTeX 内容。
 */
export async function callLargeLanguageModel(userQuery, latexContent) {
    const { apiEndpoint, apiKey, model } = getConfig();

    if (!apiEndpoint || !apiKey) {
        showPreviewMessage('<div class="error-message alert alert-danger animate__animated animate__fadeIn">API 配置不完整或无效，请检查 config.js。</div>');
        return;
    }

    if (!userQuery && !latexContent) {
        showPreviewMessage('<div class="warning-message alert alert-warning animate__animated animate__fadeIn">请输入问题或 LaTeX 内容后再调用大模型。</div>');
        return;
    }

    showLoadingMessage("正在调用大模型，请稍候...");

    // 构造发送给大模型的内容
    let promptContent = userQuery || ''; // 确保 userQuery 不是 null/undefined
    if (latexContent) {
        promptContent += `\n\n相关的 LaTeX 内容是：\n\`\`\`latex\n${latexContent}\n\`\`\``;
    }
    // 添加 LaTeX 格式提示
    promptContent += "\n\n请注意：在您的回答中，任何 LaTeX 数学公式都应使用 `$...$`（对于行内公式）或 `$$...$$`（对于块级公式）进行包裹，以便正确渲染。";


    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: "user",
                    content: promptContent.trim() // 移除首尾空白
                }],
                max_tokens: 500 // 或从 config 获取
                // stream: false // 明确指定非流式，如果 API 支持的话
            })
        });

        const data = await handleApiResponse(response); // 处理响应状态和 JSON 解析
        const rawContent = data.choices?.[0]?.message?.content ?? '未能从API响应中提取有效内容。'; // 安全访问
        renderMarkdownContent(rawContent); // 渲染结果

    } catch (error) {
        handleApiError(error, apiEndpoint); // 处理 fetch 或 handleApiResponse 抛出的错误
    }
}

/**
 * 调用大模型解释 Nerdamer 错误。
 * @param {string} latexInput 原始 LaTeX 输入。
 * @param {string} errorMessage Nerdamer 报告的错误消息。
 * @param {string} variable 涉及的变量。
 * @param {string} operation 执行的操作。
 * @param {HTMLElement} targetElement 用于显示解释的 HTML 元素。
 */
export async function explainErrorWithLLM(latexInput, errorMessage, variable, operation, targetElement) {
    if (!targetElement) {
        console.error("Target element for LLM explanation not provided.");
        return;
    }

    showLoadingMessageForElement(targetElement, "正在尝试获取大模型解释...");

    const { apiEndpoint, apiKey, model } = getConfig();

    if (!apiEndpoint || !apiKey) {
        targetElement.innerHTML = `<div class="error-message alert alert-warning">无法调用大模型：API 配置不完整。</div>`;
        return;
    }

    // 构造请求大模型的 Prompt
    const promptContent = `用户输入的 LaTeX 公式是：
\`\`\`latex
${latexInput}
\`\`\`
尝试对变量 '${variable}' 执行 '${operation}' 操作时，nerdamer 库报告了以下错误：
\`\`\`
${errorMessage}
\`\`\`
请用简洁明了的语言解释这个错误发生的原因，并指出用户输入的 LaTeX 公式中可能存在的问题或与所选操作不匹配的地方。请注意：在您的回答中，任何 LaTeX 数学公式都应使用 \`$...$\`（对于行内公式）或 \`$$...$$\`（对于块级公式）进行包裹，以便正确渲染。`;

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: promptContent }],
                max_tokens: 300 // 限制解释长度
            })
        });

        const data = await handleApiResponse(response);
        const rawContent = data.choices?.[0]?.message?.content ?? '未能从API响应中提取有效解释。';

        // 初始化 markdown-it
        if (typeof window.markdownit === 'undefined') {
             console.error("markdown-it library is not loaded for explanation.");
             targetElement.innerHTML = `<div class="error-message alert alert-warning">Markdown 渲染库加载失败。</div><pre>${rawContent}</pre>`;
             return;
        }
        const md = window.markdownit({ html: true, linkify: true, typographer: true });
        const renderedExplanation = md.render(rawContent);

        // 更新目标元素内容
        targetElement.innerHTML = `<div class="alert alert-info model-explanation animate__animated animate__fadeIn">
            <strong>大模型解释：</strong><br>
            ${renderedExplanation}
        </div>`;

        // 尝试重新渲染解释中的 MathJax
        renderMathInElement(targetElement, 'LLM Error Explanation');

    } catch (error) {
        console.error('调用大模型解释错误失败:', error);
        targetElement.innerHTML = `<div class="error-message alert alert-warning">无法获取大模型解释：${error.message}</div>`;
    }
}
