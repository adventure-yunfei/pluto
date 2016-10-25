package adv.common;

import javax.servlet.http.HttpServletRequest;

public class JspUtils {
    public static String getPath(HttpServletRequest request, String fileServletPath, String fileType) {
        String ctxtPath = request.getContextPath();
        String fileFullPath = (ctxtPath.equals("/") ? "" : ctxtPath) + fileServletPath;

        String resultPattern = null;
        if (fileType.equalsIgnoreCase("js")) {
            resultPattern = "<script src=\"%s\"></script>";
        } else if (fileType.equalsIgnoreCase("css")) {
            resultPattern = "<link rel=\"stylesheet\" type=\"text/css\" href=\"%s\"/>";
        } else if (fileType.equalsIgnoreCase("raw")) {
            resultPattern = "%s";
        }

        return String.format(resultPattern, fileFullPath);
    }
}
