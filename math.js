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
                    resultNerdamerObject = nerdamer(expression);
                    break;
                case 'diff':
                    resultNerdamerObject = nerdamer.diff(expression, variable);
                    break;
                case 'integrate':
                    resultNerdamerObject = nerdamer.integrate(expression, variable);
                    break;
                case 'solve':
                    solutions = nerdamer.solveEquations(exprString, variable);
                    if (Array.isArray(solutions)) {
                        if (solutions.length === 0) {
                            resultLatex = "\\text{无解}";
                        } else {
                            resultLatex = solutions.map(sol => `${variable} = ${nerdamer(sol.toString()).toTeX()}`).join(', \\quad ');
                        }
                    } else if (solutions) {
                        resultLatex = `${variable} = ${nerdamer(solutions.toString()).toTeX()}`;
                    } else {
                        resultLatex = "\\text{无法求解或表示解}";
                    }
                    resultNerdamerObject = null;
                    break;
                case 'factor':
                    resultNerdamerObject = nerdamer.factor(expression);
                    break;
                case 'expand':
                    resultNerdamerObject = nerdamer.expand(expression);
                    break;
                case 'substitute':
                    // 变量替换
                    const substitution = document.getElementById('substitutionVar')?.value || 'x=1';
                    const [subVar, subValue] = substitution.split('=').map(s => s.trim());
                    if (subVar && subValue) {
                        resultNerdamerObject = nerdamer(exprString).sub(subVar, subValue);
                    } else {
                        throw new Error('变量替换格式错误，请使用格式：变量=值');
                    }
                    break;
                case 'evaluate':
                    // 数值计算
                    const evalPoint = document.getElementById('evaluationPoint')?.value || 'x=0';
                    const [evalVar, evalValue] = evalPoint.split('=').map(s => s.trim());
                    if (evalVar && evalValue) {
                        const evaluated = nerdamer(exprString).sub(evalVar, evalValue);
                        resultLatex = `f(${evalValue}) = ${evaluated.toString()}`;
                    } else {
                        throw new Error('计算点格式错误，请使用格式：变量=值');
                    }
                    resultNerdamerObject = null;
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