// math.js - Handles mathematical operations using Nerdamer
import { editor, preview, variableInput, replaceEditorCheckbox } from './dom.js'; // Import necessary DOM elements
import { showLoadingMessage, showPreviewMessage, insertTextAtCursor } from './ui.js';
import { renderMathInElement } from './mathjax.js';
import { explainErrorWithLLM } from './api.js'; // Import LLM error explanation function

/**
 * 处理数学运算请求。
 * @param {string} operation 要执行的操作 (e.g., 'simplify', 'diff', 'integrate', 'solve', 'factor', 'expand').
 * @param {string} latexInput 用户输入的 LaTeX 公式。
 * @param {string} variable 运算涉及的变量名。
 */
export function processMathOperation(operation, latexInput, variable) {
    showLoadingMessage(`正在执行 ${operation}...`);

    if (!latexInput.trim()) {
        showPreviewMessage('<div class="warning-message alert alert-warning animate__animated animate__fadeIn">请输入 LaTeX 公式后再执行操作。</div>');
        return;
    }

    // 使用 setTimeout 确保加载动画能渲染出来
    setTimeout(() => {
        try {
            // 检查 Nerdamer 是否加载
            if (typeof nerdamer === 'undefined') {
                throw new Error('Nerdamer 库未能成功加载，请检查网络连接或 CDN 地址。');
            }

            // 1. 从 LaTeX 转换
            const expression = nerdamer.convertFromLaTeX(latexInput);
            const exprString = expression.toString(); // Nerdamer 需要字符串形式进行某些操作

            let resultNerdamerObject;
            let resultLatex = '';
            let solutions = null; // 用于存储 solve 的结果

            // 2. 根据操作调用 Nerdamer 函数
            switch (operation) {
                case 'simplify':
                    // Simplify 通常直接作用于表达式对象
                    resultNerdamerObject = nerdamer(expression); // 重新构造以确保应用简化规则
                    break;
                case 'diff':
                    resultNerdamerObject = nerdamer.diff(expression, variable);
                    break;
                case 'integrate':
                    resultNerdamerObject = nerdamer.integrate(expression, variable);
                    break;
                case 'solve':
                    // solveEquations 通常需要字符串形式的方程
                    solutions = nerdamer.solveEquations(exprString, variable);
                    if (Array.isArray(solutions)) {
                        // 处理多个解或无解的情况
                        if (solutions.length === 0) {
                            resultLatex = "\\text{无解}";
                        } else {
                            // --- 调试日志开始 ---
                            console.log('Nerdamer solveEquations result (solutions):', solutions);
                            solutions.forEach((sol, index) => {
                                console.log(`Solution ${index}:`, sol);
                                console.log(`Type of solution ${index}:`, typeof sol);
                                console.log(`Does solution ${index} have toTeX?`, typeof sol?.toTeX === 'function');
                            });
                            // --- 调试日志结束 ---
                            resultLatex = solutions.map(sol => `${variable} = ${nerdamer(sol.toString()).toTeX()}`).join(', \\quad ');
                        }
                    } else if (solutions) {
                        // 处理单个解：将 Symbol 对象先转为字符串，再用 nerdamer() 构造以调用 toTeX()
                        resultLatex = `${variable} = ${nerdamer(solutions.toString()).toTeX()}`;
                    } else {
                        // 处理无法表示解或特殊情况
                        resultLatex = "\\text{无法求解或表示解}";
                    }
                    resultNerdamerObject = null; // 标记为已直接生成 LaTeX
                    break;
                case 'factor':
                    resultNerdamerObject = nerdamer.factor(expression);
                    break;
                case 'expand':
                    resultNerdamerObject = nerdamer.expand(expression);
                    break;
                default:
                    throw new Error(`未知的数学运算: ${operation}`);
            }

            // 3. 转换回 LaTeX (如果 solve 没有直接生成)
            if (resultNerdamerObject !== null && typeof resultNerdamerObject?.toTeX === 'function') {
                 resultLatex = resultNerdamerObject.toTeX();
            } else if (resultNerdamerObject !== null) {
                 // 如果结果不是 null 但没有 toTeX 方法，可能是一个错误或非预期类型
                 console.error(`无法将 ${operation} 的结果转换为 LaTeX。结果对象:`, resultNerdamerObject);
                 throw new Error(`无法将 ${operation} 的结果转换为 LaTeX。`);
            } else if (!resultLatex && operation === 'solve') {
                 // 确保 solve 总是有输出，即使上面逻辑未覆盖
                 if (!solutions || (Array.isArray(solutions) && solutions.length === 0)) {
                     resultLatex = "\\text{无解或无法求解}";
                 }
            }


            // 4. 显示结果
            if (preview) {
                preview.innerHTML = `<div class="mathjax-wrapper">$$${resultLatex}$$</div>`;
                preview.classList.remove('empty');
                renderMathInElement(preview, `Math Operation Result (${operation})`); // 渲染结果
            } else {
                 console.error("Preview element not found for displaying math result.");
            }


            // 5. 根据复选框状态决定是否清空并插入结果到编辑器
            if (replaceEditorCheckbox && replaceEditorCheckbox.checked && editor) {
                editor.value = ''; // 清空编辑器
                insertTextAtCursor(editor, resultLatex); // 插入结果
            }

        } catch (error) {
            // 捕获 Nerdamer 处理过程中的所有错误
            console.error(`执行 ${operation} 时出错:`, error);
            const originalErrorMessage = error.message || '未知 Nerdamer 错误';

            // 创建用于显示错误和 LLM 解释的容器
            const errorContainer = document.createElement('div');
            errorContainer.innerHTML = `<div class="error-message alert alert-danger animate__animated animate__fadeIn">
                执行 ${operation} 时出错: <br>
                ${originalErrorMessage} <br>
                请检查输入公式和变量 ('${variable}')，或查看控制台获取详细信息。
            </div>
            <div id="llm-explanation-placeholder-${Date.now()}" class="mt-3"></div>`; // 使用唯一 ID

            if (preview) {
                preview.innerHTML = ''; // 清空旧内容
                preview.appendChild(errorContainer);
                preview.classList.remove('empty');
            } else {
                console.error("Preview element not found for displaying error.");
            }


            // 异步调用大模型解释错误
            const placeholderId = errorContainer.querySelector('[id^="llm-explanation-placeholder-"]').id;
            const placeholderElement = document.getElementById(placeholderId);
            if (placeholderElement) {
                explainErrorWithLLM(latexInput, originalErrorMessage, variable, operation, placeholderElement);
            } else {
                console.error("Could not find placeholder element for LLM explanation.");
            }
        }
    }, 50); // 短暂延迟以显示加载状态
}