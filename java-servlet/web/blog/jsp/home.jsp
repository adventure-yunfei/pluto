<%@include file="../../common/jsp/HtmlPageSetting.jsp"%>
<html>
<head>
    <title>Blog</title>
    <%@include file="IncludeRequirejsForBlog.jsp"%>
</head>
<body>
<script>
    require(['blog/jsx/BlogHomeApp', 'react'], function (BlogHomeApp, React) {
        window.app = new BlogHomeApp();
        window.app.start({
            blogs: <%=request.getAttribute("blogs")%>
        });



        <%--var RootView = React.createClass({--%>
            <%--getInitialState: function getInitialState() {--%>
                <%--return {--%>
                    <%--blogs: <%=request.getAttribute("blogs")%>--%>
                <%--};--%>
            <%--},--%>
            <%--render: function render() {--%>
                <%--var renderBlogPreview = function renderBlogPreview(blogData) {--%>
                    <%--var Content = React.createClass({--%>
                        <%--render: function render() {--%>
                            <%--var node = <div class="content">{blogData.content}</div>;--%>
                            <%--return node;--%>
                        <%--}--%>
                    <%--});--%>
                    <%--return <div class="blogPreview">--%>
                        <%--<div class="title">{blogData.title}</div>--%>
                        <%--<div class="date">{blogData.create_date}</div>--%>
                        <%--<div class="content" dangerouslySetInnerHTML={{__html: blogData.content}}></div>--%>
                    <%--</div>;--%>
                <%--};--%>

                <%--return <div class="blogsContainer">{this.state.blogs.map(renderBlogPreview)}</div>;--%>
            <%--}--%>
        <%--});--%>

        <%--React.render(<RootView/>, document.body);--%>
    });
</script>
</body>
</html>