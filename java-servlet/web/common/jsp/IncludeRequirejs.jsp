<%@ page import="adv.common.JspUtils" %>
<%@include file="HtmlPageSetting.jsp"%>
<%=JspUtils.getPath(request, "/common/plugins/require.js", "js")%>
<%=JspUtils.getPath(request, "/common/js/requirejsConfig.js", "js")%>
<script>
    requirejs.config({
        baseUrl: "<%=JspUtils.getPath(request, "/", "raw")%>"
    })
</script>