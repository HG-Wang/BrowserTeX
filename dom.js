// dom.js - DOM Element Selectors

export const editor = document.getElementById('editor');
export const preview = document.getElementById('preview');
export const parseBtn = document.getElementById('parseBtn');
export const callModelBtn = document.getElementById('callModelBtn');
export const modelQueryInput = document.getElementById('modelQuery');
export const mathOpsDropdown = document.getElementById('mathOpsDropdown');
export const variableInput = document.getElementById('variableInput');
export const container = document.querySelector('.container');
export const replaceEditorCheckbox = document.getElementById('replaceEditorCheckbox');

// 函数绘图相关元素
export const plotFunctionBtn = document.getElementById('plotFunctionBtn');
export const plotConfigPanel = document.getElementById('plotConfigPanel');
export const functionPlotDiv = document.getElementById('functionPlot');
export const generatePlotBtn = document.getElementById('generatePlotBtn');
export const closePlotConfigBtn = document.getElementById('closePlotConfigBtn');
export const xRangeMin = document.getElementById('xRangeMin');
export const xRangeMax = document.getElementById('xRangeMax');
export const yRangeMin = document.getElementById('yRangeMin');
export const yRangeMax = document.getElementById('yRangeMax');
export const showGridCheck = document.getElementById('showGridCheck');
export const showLegendCheck = document.getElementById('showLegendCheck');

// API配置相关元素
export const settingsBtn = document.getElementById('settingsBtn');
export const apiConfigPanel = document.getElementById('apiConfigPanel');
export const apiBaseUrl = document.getElementById('apiBaseUrl');
export const apiModel = document.getElementById('apiModel');
export const apiKey = document.getElementById('apiKey');
export const saveApiConfigBtn = document.getElementById('saveApiConfigBtn');
export const resetApiConfigBtn = document.getElementById('resetApiConfigBtn');
export const closeApiConfigBtn = document.getElementById('closeApiConfigBtn');