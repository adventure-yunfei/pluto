package adv.common.taskctrl;

import adv.common.RequestContext;
import adv.common.exception.ControllerException;

public abstract class BaseTaskCtrl implements ITaskCtrl {
    @Override
    public void process(RequestContext context) throws ControllerException {
        context.getResponse().setContentType("application/json");
    }
}
