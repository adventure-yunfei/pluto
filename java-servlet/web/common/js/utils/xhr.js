define(['cm/jQueryEx', 'cm/utils/util'], function ($, util) {
    return {
        /**
         * @param {{path: string, query: string=, method: string=, data: string=, headers: Object=, ajax_settings: Object=}} config
         */
        couchdb: function sendCouchdbRequest(config) {
            return $.ajax('/couchdb', util.copy(config.ajax_settings || {}, {
                data: {
                    cdb_path: config.path,
                    cdb_query: config.query,
                    cdb_method: config.method,
                    cdb_data: config.data,
                    cdb_headers: JSON.stringify(util.copy(config.headers || {}, {
                        Accept: 'application/json, */*; q=0.01'
                    }))
                }
            }));
        },

        getFiles: function getFiles(filepaths) {
            var deferred = $.Deferred(),
                loadedFiles = [],
                loadedCnt = 0;

            filepaths.forEach(function (path, idx) {
                $.ajax(require.toUrl(path))
                    .done(function (resp, status, jqXHR) {
                        loadedFiles[idx] = jqXHR.responseText;
                        loadedCnt++;

                        if (loadedCnt === filepaths.length) {
                            deferred.resolveWith(null, loadedFiles);
                        }
                    }).fail(function () {
                        deferred.reject(path);
                    });
            });

            return deferred.promise();
        }
    }
});