<%@include file="../../common/jsp/HtmlPageSetting.jsp"%>
<head>
    <%@include file="IncludeRequirejsForBlog.jsp"%>
    <link rel="stylesheet" type="text/css" href="/blog/css/blog.css"/>
</head>

<body>
<div id="title"></div>
<div id="content">
    <div id="ckeditor"></div>
</div>
<script>
    require(['jquery', 'ckeditor'], function ($) {
        $(function () {
            var blogData = <%= request.getAttribute("blogData") %>;

            $('#title').text(blogData.title);

            // Construct blog content iframe by CKEDITOR
            CKEDITOR.replace('ckeditor', {
                readOnly: true,
                contentsCss: [
                    CKEDITOR.getUrl('contents.css')
                ],
                on: {
                    instanceReady: function () {
                        // Copy the blog content iframe out to remove event handler effect inside CKEDITOR
                        var iframe = $('<iframe>').appendTo($('#content'))[0];
                        iframe.contentDocument.documentElement.innerHTML = this.document.$.documentElement.innerHTML;

                        this.element.remove()
                        this.destroy();
                    }
                }
            });
            CKEDITOR.instances.ckeditor.setData(blogData.content);
        });
    });
</script>
</body>