define(['$a'], function ($a) {
    return {
        /** 保存已加载的模板字符串, 键值为模板文件路径 */
        templates: {},

        /** 确保模板存在之后，继续执行指定操作
         * 回调函数参数为所要求的模板路径对应字符串，顺序与传入路径相同（单独对应每个参数，而非作为单个数组参数
         * @param {boolean=false} config.sync 是否强制同步请求
         * @param {Object=} config.ctxt 指定回调函数的上下文 */
        ensureTemplatesExist: function ensureTemplatesExist(templatePaths, callbackFn, config) {
            var me = this,
                allTemplates = this.templates,
                templatesToLoad = [],
                execCallback = function () {
                    if (callbackFn) {
                        var requiredTemplates = $.map(templatePaths, function (path) {
                            $a.assert(allTemplates[path]);
                            return allTemplates[path];
                        });
                        callbackFn.apply((config && config.ctxt) || null, requiredTemplates);
                    }
                };
            $.each(templatePaths, function (idx, path) {
                if (!allTemplates[path]) {
                    templatesToLoad.push(path);
                }
            });
            if (templatesToLoad.length === 0) {
                execCallback();
            } else {
                $a.ajaxWithLoading({
                    url: '/getTemplates',
                    data: JSON.stringify(templatesToLoad),
                    async: !(config && config.sync),
                    // 同步请求不支持Deferred，因而设success而非.done()回调
                    success: function (data, textStatus, jqXHR) {
                        var loadedTemplates = JSON.parse(jqXHR.responseText);
                        $.each(templatesToLoad, function (idx, path) {
                            me.templates[path] = loadedTemplates[idx];
                        });
                        execCallback();
                    }
                });
            }
        },

        /**
         * 用templateProps中的值替换 ##propName## 生成模板实例字符串
         * @param {string} templateStr
         * @param {Object} templateProps
         * @returns {string} 替换后的模板字符串
         */
        fillTemplate: function fillTemplate(templateStr, templateProps) {
            $.each(templateProps, function (key, val) {
                templateStr = templateStr.replace(new RegExp('##' + key + '##', 'g'), val);
            });
            return templateStr.replace(/##[\w_\-]*##/g, '');
        }
    };
});