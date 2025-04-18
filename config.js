// config.js
// 注意：将 API 密钥硬编码在前端非常不安全，建议后续通过后端或其他安全方式管理。
export const config = {
    apiEndpoint: "https://api.lingyiwanwu.com/v1/chat/completions",
    model: "yi-lightning",
    apiKey: "" // 强烈建议移除此硬编码密钥
};