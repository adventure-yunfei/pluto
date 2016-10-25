<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@include file="../../common/jsp/HtmlPageSetting.jsp"%>
<html>
<head>
<title>编辑Blog</title>
    <%@include file="IncludeRequirejsForBlog.jsp" %>
</head>

<body>
<input id="title" type="text" value=""/>
<div id="content">
    <div id="ckeditor" class="test"></div>
</div>
<button id="submit">OK</button>

<script type="text/javascript">
    require(['cm/jQueryEx', 'cm/utils/xhr', 'ckeditor'], function ($, xhr) {
        var initialBlogData = <%=request.getAttribute("blogData")%>,
            isCreatingNew = !initialBlogData;

        // Set title
        var jTitle = $('#title');
        jTitle.val(isCreatingNew ? '' : initialBlogData.title);

        // Set content
        CKEDITOR.replace('ckeditor', {
            contentsCss: [
                CKEDITOR.getUrl('contents.css')
            ]
        });
        CKEDITOR.instances.ckeditor.setData(isCreatingNew ? '' : initialBlogData.content);

        // Bind OK button to submit changes
        $('#submit').on('click', function (jEvent) {
            var title = $('#title').val(),
                cdb_update_path = '/blog/_design/main/_update/createOrUpdate',
                cdb_data = JSON.stringify({
                    title: title,
                    content: CKEDITOR.instances.ckeditor.getData()
                });
            if (isCreatingNew) {
                xhr.couchdb({
                    method: 'POST',
                    path: cdb_update_path,
                    data: cdb_data
                });
            } else {
                xhr.couchdb({
                    method: 'PUT',
                    path: cdb_update_path + '/' + initialBlogData.title,
                    data: cdb_data
                }).done(function () {
                    if (title !== initialBlogData.title) {
                        xhr.couchdb({
                            method: 'DELETE',
                            path: '/blog/' + initialBlogData.title,
                            query: 'rev=' + initialBlogData._rev
                        });
                    }
                });
            }
        });
    });
</script>
</body>
</html>