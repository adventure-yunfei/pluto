package adv.common.servlet;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import adv.common.Config;
import adv.common.RequestContext;
import adv.common.exception.ConfigNotFound;
import adv.common.exception.ControllerException;
import adv.common.exception.GeneralException;
import adv.common.taskctrl.ITaskCtrl;

public class TaskServlet extends BaseServlet {
    private static final String PARAM_PROJECT_NAME = "proj";
    private static final String PARAM_TASK_ID = "task";
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            ITaskCtrl task = Config.getConfig(req.getParameter(PARAM_PROJECT_NAME)).getTaskInstance(req.getParameter(PARAM_TASK_ID));
            task.process(new RequestContext(req, resp));
        } catch (GeneralException | ConfigNotFound | ControllerException e) {
            throw new ServletException(e);
        }
    }
}