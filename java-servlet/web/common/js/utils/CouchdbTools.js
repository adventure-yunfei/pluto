define(['jquery', 'cm/utils/xhr', 'cm/utils/util'], function ($, xhr, util) {
    function setupDesignDoc(ddoc_cdb_path, designDoc, isCleanSetup) {
        function createOrUpdateDesignDoc(rev) {
            xhr.couchdb({
                method: 'PUT',
                path: ddoc_cdb_path,
                query: rev ? 'rev=' + rev : undefined,
                data: JSON.stringify(designDoc)
            });
        }

        if (isCleanSetup) {
            createOrUpdateDesignDoc();
        } else {
            xhr.couchdb({
                method: 'GET',
                path: ddoc_cdb_path
            }).done(function (ddoc) {
                createOrUpdateDesignDoc(ddoc._rev);
            });
        }
    }

    function ensureDBExisted(db, isCleanSetup) {
        var deferred = $.Deferred(),
            dbXHR = function (method) {
                return xhr.couchdb({
                    method: method,
                    path: '/' + db
                });
            };
        dbXHR('GET').done(function () {
            if (isCleanSetup) {
                dbXHR('DELETE').done(function () {
                    util.bindPromiseState(dbXHR('PUT'), deferred);
                }).fail(function () {
                    deferred.reject();
                });
            } else {
                deferred.resolve();
            }
        }).fail(function () {
            util.bindPromiseState(dbXHR('PUT'), deferred);
        });

        return deferred.promise();
    }

    return {
        setup_blog: function setup_blog(isCleanSetup) {
            ensureDBExisted('blog', isCleanSetup).done(function () {
                xhr.getFiles(['plugins/dateFormat.js']).done(function (dateFormat_js) {
                    setupDesignDoc('/blog/_design/main', {
                        language: 'javascript',
                        lib: {
                            DateFormat: dateFormat_js + ' exports["format"] = DateFormat.format;'
                        },
                        views: {
                            by_title: {
                                map: function (doc) {
                                    emit(doc.title, doc);
                                }.toString()
                            },
                            by_create_date: {
                                map: function (doc) {
                                    emit(doc.create_date, doc);
                                }.toString()
                            }
                        },
                        updates: {
                            createOrUpdate: function (doc, req) {
                                var DateFormat = require('lib/DateFormat');
                                req = JSON.parse(req.body);
                                var currentDate = require('lib/DateFormat').format.date(new Date(Date.now()), 'yyyy-MM-dd HH:mm:ss');
                                if (!doc) {
                                    if (req.title) {
                                        // Create new blog
                                        return [{
                                            _id: req.title,
                                            title: req.title,
                                            content: req.content,
                                            create_date: currentDate,
                                            last_modify_date: currentDate
                                        }, {json: {success: true}}];
                                    } else {
                                        // Wrong request without "title"
                                        return [null, {
                                            code: 400,
                                            json: {
                                                error: 'Wrong parameters',
                                                message: '"title" is required when create new blog.'
                                            }
                                        }];
                                    }
                                } else {
                                    // Update existing blog
                                    for (var key in req) {
                                        doc[key] = req[key];
                                    }
                                    doc._id = req.title || doc._id;
                                    doc.last_modify_date = currentDate;
                                    return [doc, {json: {success: true}}];
                                }
                            }.toString()
                        }
                    }, isCleanSetup);
                });
            });
        }
    };
});