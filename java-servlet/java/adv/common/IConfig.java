package adv.common;

import adv.common.exception.GeneralException;
import adv.common.pagectrl.IPageCtrl;
import adv.common.taskctrl.ITaskCtrl;

public interface IConfig {
    public String getPageJSP(String targetPage);
    
    public IPageCtrl getPageController(String targetPage) throws GeneralException;
    
    public ITaskCtrl getTaskInstance(String taskId) throws GeneralException;
}
