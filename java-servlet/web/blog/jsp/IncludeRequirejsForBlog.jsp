<%@include file="../../common/jsp/IncludeRequirejs.jsp"%>
<script>
    requirejs.config({
        paths: {
            blog: 'blog/js',
            ckeditor: 'common/plugins/ckeditor/ckeditor'
        }
    });
</script>