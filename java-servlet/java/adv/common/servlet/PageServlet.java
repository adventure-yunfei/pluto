package adv.common.servlet;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import adv.common.Config;
import adv.common.IConfig;
import adv.common.RequestContext;
import adv.common.exception.ConfigNotFound;
import adv.common.exception.ControllerException;
import adv.common.exception.GeneralException;

public class PageServlet extends BaseServlet {
    private static final long serialVersionUID = -87003406323860881L;
    private final String PARAM_TARGET_PAGE = "on";
    private final String DEFAULT_PAGE = "home";
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
        throws ServletException, IOException {
        doPost(req, resp);
    }
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            IConfig config = Config.getConfig(req.getServletPath().substring(1));
            String targetPage = req.getParameter(PARAM_TARGET_PAGE) != null ? req.getParameter(PARAM_TARGET_PAGE) : DEFAULT_PAGE;
            
            // Process request by page controller
            config.getPageController(targetPage).process(new RequestContext(req, resp));
            
            req.getRequestDispatcher(config.getPageJSP(targetPage)).forward(req, resp);
        } catch (ConfigNotFound | ControllerException | GeneralException e) {
            throw new ServletException(e);
        }
    }
}