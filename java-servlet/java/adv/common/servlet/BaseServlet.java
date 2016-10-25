package adv.common.servlet;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;

public class BaseServlet extends HttpServlet {
    protected String getParam(HttpServletRequest req, String paramName) {
        return req.getParameter(paramName);
    }
    protected String getParam(HttpServletRequest req, String paramName, String defaultValue) {
        String value = req.getParameter(paramName);
        return value != null ? value : defaultValue;
    }
}