// plot.js - Handles function plotting using function-plot and Nerdamer
import {
    editor, preview, functionPlotDiv, plotConfigPanel,
    xRangeMin, xRangeMax, yRangeMin, yRangeMax,
    showGridCheck, showLegendCheck, variableInput
} from './dom.js';
import { showLoadingMessageForElement, showPreviewMessage } from './ui.js';

// 定义颜色循环数组
const PLOT_COLORS = ['#17a2b8', '#dc3545', '#ffc107', '#28a745', '#6f42c1', '#fd7e14'];

/**
 * 解析 LaTeX 表达式字符串为 function-plot 所需的数据格式。
 * @param {string} latexExpr 单个 LaTeX 函数表达式。
 * @param {number} index 函数索引，用于颜色和图例。
 * @param {boolean} addLegend 是否添加图例标题。
 * @param {string} variableName 变量名。
 * @returns {object} 包含 fn, color, graphType 等属性的对象。
 * @throws {Error} 如果 Nerdamer 或转换失败。
 */
function parseLatexForPlotting(latexExpr, index, addLegend, variableName) {
    if (typeof nerdamer === 'undefined') {
        throw new Error('Nerdamer 库未能成功加载。');
    }
    try {
        const expression = nerdamer.convertFromLaTeX(latexExpr);
        const exprString = expression.toString(); // function-plot 需要普通数学表达式字符串
        // 将用户自定义变量替换为 'x' 以兼容绘图
        let plotExpr = exprString;
        if (variableName !== 'x') {
            const varRegex = new RegExp(`\\b${variableName}\\b`, 'g');
            plotExpr = exprString.replace(varRegex, 'x');
        }
        const color = PLOT_COLORS[index % PLOT_COLORS.length];

        const dataItem = {
            fn: plotExpr,
            color: color,
            graphType: 'polyline', // 或 'scatter' 等
            nSamples: 1000, // 采样点数，影响平滑度
            sampler: 'builtIn' // 使用内置采样器
        };

        if (addLegend) {
            // 使用原始 LaTeX 表达式作为图例标题，更直观
            dataItem.title = `f_${index + 1}(${variableName}) = ${latexExpr}`;
        }

        return dataItem;

    } catch (err) {
        console.error(`处理函数 "${latexExpr}" 时出错:`, err);
        // 重新抛出错误，包含原始 LaTeX 表达式以便上层处理
        throw new Error(`无法解析或转换函数 $${latexExpr}$: ${err.message}`);
    }
}

/**
 * 从编辑器中的 LaTeX 公式生成函数绘图。
 * @param {string} latexInput 包含一个或多个 LaTeX 函数表达式的字符串（用换行符分隔）。
 */
export function plotLatexFunction(latexInput) {
    // 清空之前的绘图和消息
    if (functionPlotDiv) functionPlotDiv.innerHTML = '';
    if (preview) {
        preview.innerHTML = '';
        preview.classList.add('empty');
    }

    // 检查 function-plot 库
    if (typeof functionPlot === 'undefined') {
        showPreviewMessage('<div class="error-message alert alert-danger">Function-Plot 库未能成功加载，无法绘图。</div>');
        console.error('Function-Plot library is not loaded.');
        return;
    }

    // 显示绘图容器并添加加载指示
    if (functionPlotDiv) {
        functionPlotDiv.classList.remove('d-none', 'animate__fadeOut');
        functionPlotDiv.classList.add('animate__fadeIn');
        showLoadingMessageForElement(functionPlotDiv, "正在生成函数图像...");
    } else {
        console.error("Function plot container (functionPlotDiv) not found.");
        return; // 没有绘图容器，无法继续
    }

    // 隐藏配置面板 (如果可见)
    if (plotConfigPanel) {
        plotConfigPanel.classList.remove('animate__fadeIn');
        plotConfigPanel.classList.add('animate__fadeOut');
        setTimeout(() => {
            plotConfigPanel.classList.add('d-none');
        }, 500); // 等待动画完成
    }

    // 使用 setTimeout 确保加载动画能渲染出来
    setTimeout(() => {
        try {
            // --- 处理多个函数 ---
            const latexExpressions = latexInput.split('\n')
                                         .map(s => s.trim())
                                         .filter(s => s !== ''); // 分割、去空格、去空行

            if (latexExpressions.length === 0) {
                throw new Error("未输入有效的函数表达式。");
            }

            const plotData = [];
            const errors = [];
            const variable = variableInput?.value.trim() || 'x'; // 获取变量名
            const addLegend = showLegendCheck?.checked ?? false; // 获取图例选项

            latexExpressions.forEach((latexExpr, index) => {
                try {
                    const dataItem = parseLatexForPlotting(latexExpr, index, addLegend, variable);
                    plotData.push(dataItem);
                } catch (err) {
                    errors.push(err.message); // 收集解析错误信息
                }
            });
            // --- 结束处理多个函数 ---

            // 如果所有函数都解析失败
            if (plotData.length === 0 && errors.length > 0) {
                throw new Error(errors.join("<br>"));
            }

            // --- 获取绘图选项 ---
            const xMin = parseFloat(xRangeMin?.value) || -10;
            const xMax = parseFloat(xRangeMax?.value) || 10;
            const yMin = parseFloat(yRangeMin?.value) || -10;
            const yMax = parseFloat(yRangeMax?.value) || 10;
            const showGrid = showGridCheck?.checked ?? true; // 默认显示网格

            const plotOptions = {
                target: functionPlotDiv, // 绘图目标元素
                title: `函数图像: ${latexExpressions.map(e => `$${e}$`).join(', ')}`, // 动态标题
                width: functionPlotDiv.clientWidth || 600, // 适应容器宽度
                height: 400, // 固定高度或根据容器调整
                tip: { // 鼠标悬停提示
                    xLine: true,
                    yLine: true
                },
                xAxis: {
                    label: variable, // x轴标签为变量名
                    domain: [xMin, xMax]
                },
                yAxis: {
                    label: 'f(' + variable + ')', // y轴标签
                    domain: [yMin, yMax]
                },
                grid: showGrid, // 是否显示网格
                data: plotData // 要绘制的函数数据
            };

            // 如果启用了图例，添加图例配置
            if (addLegend) {
                plotOptions.legend = {
                    position: 'bottom' // 或 'top', 'left', 'right'
                    // 可选：backgroundColor: 'rgba(255, 255, 255, 0.8)'
                };
            }
            // --- 结束获取绘图选项 ---


            // 清空加载状态，执行绘图
            functionPlotDiv.innerHTML = ''; // 清除 "正在生成..."
            functionPlot(plotOptions);

            // 如果有部分函数解析失败，在绘图下方显示错误信息
            if (errors.length > 0) {
                 const errorDiv = document.createElement('div');
                 errorDiv.className = 'alert alert-warning mt-2';
                 errorDiv.innerHTML = `<strong>部分函数未能绘制:</strong><br>${errors.join('<br>')}`;
                 functionPlotDiv.appendChild(errorDiv); // 追加到绘图区域下方
            }

        } catch (error) {
            // 捕获解析、绘图过程中的其他错误
            console.error("Error plotting function:", error);
            if (functionPlotDiv) {
                 // 清除加载状态，显示错误
                 functionPlotDiv.innerHTML = `<div class="error-message alert alert-danger animate__animated animate__fadeIn">绘图失败: ${error.message}</div>`;
            } else {
                 // 如果绘图容器都没了，就在预览区显示
                 showPreviewMessage(`<div class="error-message alert alert-danger animate__animated animate__fadeIn">绘图失败: ${error.message}</div>`);
            }
        }
    }, 50); // 短暂延迟以显示加载状态
}
