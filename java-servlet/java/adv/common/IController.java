package adv.common;

import adv.common.exception.ControllerException;

public interface IController {
    public void process(RequestContext context) throws ControllerException;
}
