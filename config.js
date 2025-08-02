// config.js
// 默认API配置
export const defaultConfig = {
    apiEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    model: "GLM-4.5-Flash",
    apiKey: "84dbdbaa8c154d13a2f22adaefeaae5a.3d9NdwqkU5rgwlWz"
};

// 当前使用的配置（会从localStorage加载用户自定义配置）
let currentConfig = { ...defaultConfig };

// 从localStorage加载用户配置
function loadUserConfig() {
    try {
        const savedConfig = localStorage.getItem('apiConfig');
        if (savedConfig) {
            const userConfig = JSON.parse(savedConfig);
            // 只更新用户提供的字段，其他字段保持默认值
            if (userConfig.apiEndpoint) currentConfig.apiEndpoint = userConfig.apiEndpoint;
            if (userConfig.model) currentConfig.model = userConfig.model;
            if (userConfig.apiKey) currentConfig.apiKey = userConfig.apiKey;
        }
    } catch (error) {
        console.error('加载用户配置失败:', error);
    }
}

// 保存用户配置到localStorage
export function saveUserConfig(config) {
    try {
        localStorage.setItem('apiConfig', JSON.stringify(config));
        // 更新当前配置
        if (config.apiEndpoint) currentConfig.apiEndpoint = config.apiEndpoint;
        if (config.model) currentConfig.model = config.model;
        if (config.apiKey) currentConfig.apiKey = config.apiKey;
        return true;
    } catch (error) {
        console.error('保存用户配置失败:', error);
        return false;
    }
}

// 重置为默认配置
export function resetToDefaultConfig() {
    currentConfig = { ...defaultConfig };
    localStorage.removeItem('apiConfig');
}

// 获取当前配置
export function getConfig() {
    return currentConfig;
}

// 初始化时加载用户配置
loadUserConfig();

// 导出当前配置供其他模块使用
export const config = currentConfig;