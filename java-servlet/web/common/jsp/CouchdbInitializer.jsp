<%@include file="HtmlPageSetting.jsp"%>
<html>
<head>
</head>
<body>
<jsp:include page="IncludeRequirejs.jsp" flush="true"/>
<script type="text/javascript">
    require(['cm/utils/CouchdbTools'], function (CouchdbTools) {
        window.CouchdbTools = CouchdbTools;
    });
</script>
</body>
</html>